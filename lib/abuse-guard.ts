import { createHmac } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { env, requireEnv } from "./env";

// Hard caps that keep sign-in email inside the shared Resend Free quota
// (100/day, 3000/month across projects) and writes inside Neon Free.
export const LIMITS = {
  emailPerRecipientHour: 3,
  emailPerRecipientDay: 5,
  emailPerIpHour: 5,
  emailPerIpDay: 20,
  emailGlobalDay: 40,
  emailGlobalMonth: 1000,
  verifyPerIpTenMinutes: 20,
  writesPerUserDay: 300,
} as const;

export const RETENTION_DAYS = 35;
export const MAX_EMAIL_LENGTH = 254;

export type Window = "10min" | "hour" | "day" | "month";
export type Bucket = {
  name: string;
  key: string;
  window: Window;
  limit: number;
};
// Increments every bucket still under its limit; true = under the limit.
export type Counter = (buckets: Bucket[]) => Promise<boolean[]>;

export type MagicLinkDecision =
  | { action: "send"; email: string }
  | { action: "fake-success" }
  | { action: "reject"; status: 400 | 429 | 503 };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function windowStart(window: Window, now = new Date()): Date {
  const ms = now.getTime();
  switch (window) {
    case "10min":
      return new Date(ms - (ms % 600_000));
    case "hour":
      return new Date(ms - (ms % 3_600_000));
    case "day":
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
    case "month":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}

export function clientIp(headers: Headers | undefined | null): string {
  const realIp = headers?.get("x-real-ip")?.trim();
  const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  return realIp || forwarded || "unknown";
}

function hashKey(kind: string, value: string): string {
  return createHmac("sha256", requireEnv("BETTER_AUTH_SECRET"))
    .update(`${kind}:${value}`)
    .digest("hex")
    .slice(0, 32);
}

// One statement, one round trip: each bucket is an atomic upsert that only
// increments while under its limit, so concurrent requests cannot overshoot.
export const durableCounter: Counter = async (buckets) => {
  const ctes: SQL[] = buckets.map(
    (b, i) => sql`${sql.raw(`b${i}`)} AS (
      INSERT INTO abuse_counters (bucket, key_hash, window_start, count)
      VALUES (${b.name}, ${b.key}, ${windowStart(b.window).toISOString()}, 1)
      ON CONFLICT (bucket, key_hash, window_start)
      DO UPDATE SET count = abuse_counters.count + 1
      WHERE abuse_counters.count < ${b.limit}
      RETURNING count
    )`,
  );
  const columns = buckets.map(
    (_, i) =>
      sql`(SELECT count FROM ${sql.raw(`b${i}`)}) AS ${sql.raw(`c${i}`)}`,
  );
  const result = await db.execute(
    sql`WITH ${sql.join(ctes, sql`, `)} SELECT ${sql.join(columns, sql`, `)}`,
  );
  const row = (result.rows[0] ?? {}) as Record<string, unknown>;
  const counts = buckets.map((_, i) => row[`c${i}`]);

  // First hit of a new day somewhere: prune old windows (cheap, indexed).
  if (
    counts.some((c, i) => Number(c) === 1 && buckets[i]?.window !== "10min")
  ) {
    await db.execute(
      sql`DELETE FROM abuse_counters WHERE window_start < now() - make_interval(days => ${RETENTION_DAYS})`,
    );
  }
  return counts.map((c) => c !== null && c !== undefined);
};

async function underLimits(
  buckets: Bucket[],
  counter: Counter,
  label: string,
): Promise<boolean> {
  try {
    const allowed = await counter(buckets);
    if (allowed.every(Boolean)) return true;
    const hit = buckets
      .filter((_, i) => !allowed[i])
      .map((b) => `${b.name}/${b.window}#${b.key.slice(0, 12)}`);
    console.warn(`[abuse-guard] ${label} denied: ${hit.join(", ")}`);
    return false;
  } catch (error) {
    console.warn(
      `[abuse-guard] ${label} denied, counter failed: ${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    return false;
  }
}

export async function checkMagicLinkSend(
  input: { email: string; ip: string; honeypot: unknown },
  counter: Counter = durableCounter,
): Promise<MagicLinkDecision> {
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") {
    return { action: "fake-success" };
  }
  if (env().AUTH_EMAIL_ENABLED !== "true") {
    return { action: "reject", status: 503 };
  }

  const email = input.email.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return { action: "reject", status: 400 };
  }

  const recipient = hashKey("email", email);
  const ip = hashKey("ip", input.ip);
  const allowed = await underLimits(
    [
      {
        name: "email:recipient",
        key: recipient,
        window: "hour",
        limit: LIMITS.emailPerRecipientHour,
      },
      {
        name: "email:recipient",
        key: recipient,
        window: "day",
        limit: LIMITS.emailPerRecipientDay,
      },
      {
        name: "email:ip",
        key: ip,
        window: "hour",
        limit: LIMITS.emailPerIpHour,
      },
      { name: "email:ip", key: ip, window: "day", limit: LIMITS.emailPerIpDay },
      {
        name: "email:global",
        key: "global",
        window: "day",
        limit: LIMITS.emailGlobalDay,
      },
      {
        name: "email:global",
        key: "global",
        window: "month",
        limit: LIMITS.emailGlobalMonth,
      },
    ],
    counter,
    "magic-link email",
  );
  return allowed
    ? { action: "send", email }
    : { action: "reject", status: 429 };
}

export async function checkMagicLinkVerify(
  ip: string,
  counter: Counter = durableCounter,
): Promise<boolean> {
  return underLimits(
    [
      {
        name: "verify:ip",
        key: hashKey("ip", ip),
        window: "10min",
        limit: LIMITS.verifyPerIpTenMinutes,
      },
    ],
    counter,
    "magic-link verify",
  ).catch(() => false);
}

export async function checkUserWriteCap(
  userId: string,
  counter: Counter = durableCounter,
): Promise<boolean> {
  return underLimits(
    [
      {
        name: "write:user",
        key: hashKey("user", userId),
        window: "day",
        limit: LIMITS.writesPerUserDay,
      },
    ],
    counter,
    "user write",
  ).catch(() => false);
}
