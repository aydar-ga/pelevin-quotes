import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  DEV_TEST_USER_EMAIL,
  isDevTestAuthEnabled,
  shouldCaptureMagicLink,
  shouldSkipMagicLinkEmail,
} from "@/lib/dev-test-auth";

describe("dev-test-auth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Vitest inherits process env (e.g. Playwright step in CI); unit tests assert defaults.
    delete process.env.DEV_TEST_AUTH;
    delete process.env.E2E_TEST_MODE;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled by default", () => {
    expect(isDevTestAuthEnabled()).toBe(false);
  });

  it("enables when DEV_TEST_AUTH=true", () => {
    vi.stubEnv("DEV_TEST_AUTH", "true");
    expect(isDevTestAuthEnabled()).toBe(true);
  });

  it("skips email for the dev test user when enabled", () => {
    vi.stubEnv("DEV_TEST_AUTH", "true");
    expect(shouldSkipMagicLinkEmail(DEV_TEST_USER_EMAIL)).toBe(true);
    expect(shouldSkipMagicLinkEmail("other@example.com")).toBe(false);
  });

  it("stays disabled in Vercel Production even when DEV_TEST_AUTH=true", () => {
    vi.stubEnv("DEV_TEST_AUTH", "true");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isDevTestAuthEnabled()).toBe(false);
  });

  it("does not keep magic links in memory by default", () => {
    expect(shouldCaptureMagicLink()).toBe(false);
  });

  it("keeps magic links only in dev or e2e test mode", () => {
    vi.stubEnv("E2E_TEST_MODE", "true");
    expect(shouldCaptureMagicLink()).toBe(true);
    vi.stubEnv("E2E_TEST_MODE", "false");
    vi.stubEnv("DEV_TEST_AUTH", "true");
    expect(shouldCaptureMagicLink()).toBe(true);
  });

  it("never keeps magic links in Vercel Production", () => {
    vi.stubEnv("E2E_TEST_MODE", "true");
    vi.stubEnv("DEV_TEST_AUTH", "true");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(shouldCaptureMagicLink()).toBe(false);
  });
});
