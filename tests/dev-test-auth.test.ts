import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  DEV_TEST_USER_EMAIL,
  isDevTestAuthEnabled,
  shouldSkipMagicLinkEmail,
} from "@/lib/dev-test-auth";

describe("dev-test-auth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
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
});
