import { afterEach, describe, expect, it, vi } from "vitest";
import { env, isProductionDeployment, requireEnv } from "@/lib/env";

const SECRET = "s".repeat(32);

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses without throwing when optional variables are missing, so builds never fail on env", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(() => env()).not.toThrow();
    expect(env().DATABASE_URL).toBeUndefined();
  });

  it("treats blank strings as unset", () => {
    vi.stubEnv("BETTER_AUTH_URL", "  ");
    expect(env().BETTER_AUTH_URL).toBeUndefined();
  });

  it("turns flags into booleans", () => {
    vi.stubEnv("DEV_TEST_AUTH", "true");
    vi.stubEnv("E2E_TEST_MODE", "false");
    expect(env().DEV_TEST_AUTH).toBe(true);
    expect(env().E2E_TEST_MODE).toBe(false);
  });

  it("fails closed on a short auth secret and never echoes its value", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short-secret-value");
    expect(() => env()).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => env()).not.toThrow(/too-short-secret-value/);
  });

  it("fails closed on a malformed URL", () => {
    vi.stubEnv("BETTER_AUTH_URL", "not a url");
    expect(() => env()).toThrow(/BETTER_AUTH_URL/);
  });

  it("requireEnv returns a present value", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", SECRET);
    expect(requireEnv("BETTER_AUTH_SECRET")).toBe(SECRET);
  });

  it("requireEnv throws at use time when a variable is missing", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => requireEnv("DATABASE_URL")).toThrow(
      "Missing required environment variable: DATABASE_URL",
    );
  });

  it("knows when it runs in Vercel Production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isProductionDeployment()).toBe(false);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isProductionDeployment()).toBe(true);
  });
});
