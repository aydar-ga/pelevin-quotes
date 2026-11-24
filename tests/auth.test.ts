import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuth, getAuth } from "@/lib/auth";

describe("lib/auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed at request time when BETTER_AUTH_SECRET is missing", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    expect(() => getAuth()).toThrow(
      "Missing required environment variable: BETTER_AUTH_SECRET",
    );
  });

  it("forces Secure, HttpOnly, SameSite=Lax session cookies in Production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("BETTER_AUTH_URL", "https://pelevin-like.app");
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/db");
    const advanced = createAuth().options.advanced;
    expect(advanced?.useSecureCookies).toBe(true);
    expect(advanced?.defaultCookieAttributes).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
    });
  });

  it("turns off Better Auth's in-memory limiter only in dev/e2e test mode, never in Production", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/db");
    vi.stubEnv("E2E_TEST_MODE", "true");
    vi.stubEnv("VERCEL_ENV", "");
    expect(createAuth().options.rateLimit?.enabled).toBe(false);

    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("BETTER_AUTH_URL", "https://pelevin-like.app");
    expect(createAuth().options.rateLimit?.enabled).not.toBe(false);
  });
});
