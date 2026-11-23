import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readMagicLink = vi.fn();

vi.mock("@/lib/magic-link-store", () => ({
  readMagicLink: (...args: unknown[]) => readMagicLink(...args),
}));

import { GET } from "@/app/dev/login/route";

describe("/dev/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DEV_TEST_AUTH", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true } as Response),
    );
    readMagicLink.mockReturnValue({
      url: "http://localhost/api/auth/magic-link/verify?token=t",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is hidden unless dev test auth is enabled", async () => {
    vi.stubEnv("DEV_TEST_AUTH", "false");
    const response = await GET(new Request("http://localhost/dev/login"));
    expect(response.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("is hidden in Vercel Production even when the flag is set by mistake", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const response = await GET(new Request("http://localhost/dev/login"));
    expect(response.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requests the magic link as a named sign-up so a fresh database works", async () => {
    await GET(new Request("http://localhost/dev/login"));

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(String(init?.body)) as {
      name?: string;
      metadata?: { intent?: string };
    };
    expect(body.metadata).toEqual({ intent: "sign-up" });
    expect(body.name).toBeTruthy();
  });

  it("sends its own Origin, which Better Auth 1.7+ requires on fetch-metadata requests", async () => {
    await GET(new Request("http://localhost:3102/dev/login"));

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("Origin")).toBe(
      "http://localhost:3102",
    );
  });
});
