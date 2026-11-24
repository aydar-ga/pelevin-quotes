import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Bucket,
  LIMITS,
  checkMagicLinkSend,
  checkMagicLinkVerify,
  checkUserWriteCap,
  clientIp,
  windowStart,
} from "@/lib/abuse-guard";

// In-memory stand-in for the durable Postgres counter, same contract:
// increment each bucket that is under its limit, report which ones were.
function fakeCounter() {
  const counts = new Map<string, number>();
  const counter = vi.fn(async (buckets: Bucket[]) =>
    buckets.map((b) => {
      const id = `${b.name}|${b.key}|${b.window}`;
      const current = counts.get(id) ?? 0;
      if (current >= b.limit) return false;
      counts.set(id, current + 1);
      return true;
    }),
  );
  return { counter, counts };
}

const send = (
  counter: ReturnType<typeof fakeCounter>["counter"],
  overrides: Partial<{ email: string; ip: string; honeypot: unknown }> = {},
) =>
  checkMagicLinkSend(
    {
      email: "reader@example.com",
      ip: "203.0.113.7",
      honeypot: "",
      ...overrides,
    },
    counter,
  );

describe("abuse guard: magic-link email", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_EMAIL_ENABLED", "true");
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fakes success for a filled honeypot and never counts or sends", async () => {
    const { counter } = fakeCounter();
    await expect(send(counter, { honeypot: "http://spam" })).resolves.toEqual({
      action: "fake-success",
    });
    expect(counter).not.toHaveBeenCalled();
  });

  it("refuses with 503 unless the kill switch AUTH_EMAIL_ENABLED is exactly true", async () => {
    const { counter } = fakeCounter();
    for (const value of ["", "false", "1", "TRUE"]) {
      vi.stubEnv("AUTH_EMAIL_ENABLED", value);
      await expect(send(counter)).resolves.toEqual({
        action: "reject",
        status: 503,
      });
    }
    expect(counter).not.toHaveBeenCalled();
  });

  it("rejects malformed or over-long emails before touching the database", async () => {
    const { counter } = fakeCounter();
    const long = `${"a".repeat(250)}@x.io`;
    for (const email of ["not-an-email", "a@b", long]) {
      await expect(send(counter, { email })).resolves.toEqual({
        action: "reject",
        status: 400,
      });
    }
    expect(counter).not.toHaveBeenCalled();
  });

  it("lowercases the recipient", async () => {
    const { counter } = fakeCounter();
    await expect(
      send(counter, { email: "  Reader@Example.COM " }),
    ).resolves.toEqual({ action: "send", email: "reader@example.com" });
  });

  it("caps one recipient at 3 per hour, even across IPs and letter case", async () => {
    const { counter } = fakeCounter();
    for (let i = 0; i < LIMITS.emailPerRecipientHour; i++) {
      expect((await send(counter, { ip: `198.51.100.${i}` })).action).toBe(
        "send",
      );
    }
    await expect(
      send(counter, { email: "READER@example.com", ip: "198.51.100.99" }),
    ).resolves.toEqual({ action: "reject", status: 429 });
  });

  it("caps one recipient at 5 per day", async () => {
    expect(LIMITS.emailPerRecipientDay).toBe(5);
    const buckets = await bucketsFor(send);
    expect(buckets).toContainEqual(
      expect.objectContaining({
        name: "email:recipient",
        window: "day",
        limit: 5,
      }),
    );
  });

  it("caps one IP at 5 per hour across different recipients", async () => {
    const { counter } = fakeCounter();
    for (let i = 0; i < LIMITS.emailPerIpHour; i++) {
      expect((await send(counter, { email: `r${i}@example.com` })).action).toBe(
        "send",
      );
    }
    await expect(send(counter, { email: "r99@example.com" })).resolves.toEqual({
      action: "reject",
      status: 429,
    });
  });

  it("checks per-IP day, app-wide day and app-wide month caps", async () => {
    const buckets = await bucketsFor(send);
    expect(buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "email:ip", window: "day", limit: 20 }),
        expect.objectContaining({
          name: "email:global",
          key: "global",
          window: "day",
          limit: 40,
        }),
        expect.objectContaining({
          name: "email:global",
          key: "global",
          window: "month",
          limit: 1000,
        }),
      ]),
    );
  });

  it("stops the whole app at 40 emails a day", async () => {
    const { counter } = fakeCounter();
    for (let i = 0; i < LIMITS.emailGlobalDay; i++) {
      const ip = `10.0.${Math.floor(i / 4)}.${i}`;
      expect(
        (await send(counter, { email: `g${i}@example.com`, ip })).action,
      ).toBe("send");
    }
    await expect(
      send(counter, { email: "late@example.com", ip: "10.9.9.9" }),
    ).resolves.toEqual({ action: "reject", status: 429 });
  });

  it("stores only hashes: no raw email or IP reaches the counter", async () => {
    const buckets = await bucketsFor(send);
    const keys = buckets.map((b) => b.key).join(" ");
    expect(keys).not.toContain("reader@example.com");
    expect(keys).not.toContain("203.0.113.7");
  });

  it("fails closed with 429 when the database check errors", async () => {
    const counter = vi.fn(async () => {
      throw new Error("db down");
    });
    await expect(send(counter)).resolves.toEqual({
      action: "reject",
      status: 429,
    });
  });
});

describe("abuse guard: verify and writes", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("caps magic-link verification at 20 per IP per 10 minutes", async () => {
    const { counter } = fakeCounter();
    for (let i = 0; i < LIMITS.verifyPerIpTenMinutes; i++) {
      expect(await checkMagicLinkVerify("203.0.113.7", counter)).toBe(true);
    }
    expect(await checkMagicLinkVerify("203.0.113.7", counter)).toBe(false);
    expect(await checkMagicLinkVerify("203.0.113.8", counter)).toBe(true);
  });

  it("caps each user at 300 writes a day", async () => {
    const { counter } = fakeCounter();
    for (let i = 0; i < LIMITS.writesPerUserDay; i++) {
      expect(await checkUserWriteCap("user-1", counter)).toBe(true);
    }
    expect(await checkUserWriteCap("user-1", counter)).toBe(false);
    expect(await checkUserWriteCap("user-2", counter)).toBe(true);
  });

  it("fails closed when the database check errors", async () => {
    const broken = vi.fn(async () => {
      throw new Error("db down");
    });
    expect(await checkMagicLinkVerify("203.0.113.7", broken)).toBe(false);
    expect(await checkUserWriteCap("user-1", broken)).toBe(false);
  });
});

describe("abuse guard: helpers", () => {
  it("aligns windows to UTC boundaries", () => {
    const now = new Date("2026-11-24T13:47:12.345Z");
    expect(windowStart("10min", now).toISOString()).toBe(
      "2026-11-24T13:40:00.000Z",
    );
    expect(windowStart("hour", now).toISOString()).toBe(
      "2026-11-24T13:00:00.000Z",
    );
    expect(windowStart("day", now).toISOString()).toBe(
      "2026-11-24T00:00:00.000Z",
    );
    expect(windowStart("month", now).toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });

  it("reads the client IP from Vercel's headers", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.7" }))).toBe(
      "203.0.113.7",
    );
    expect(
      clientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" })),
    ).toBe("198.51.100.1");
    expect(clientIp(undefined)).toBe("unknown");
  });
});

async function bucketsFor(run: typeof send) {
  const { counter } = fakeCounter();
  vi.stubEnv("AUTH_EMAIL_ENABLED", "true");
  vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
  await run(counter);
  return counter.mock.calls[0]?.[0] ?? [];
}
