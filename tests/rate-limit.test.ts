import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_IN_MEMORY_BUCKETS,
  checkInMemoryRateLimit,
  checkRandomQuoteRateLimit,
  checkVoteRateLimit,
  inMemoryRateLimitSize,
  rateLimitKeyFromHeaders,
  resetInMemoryRateLimit,
} from "@/lib/rate-limit";

describe("rate limit helpers", () => {
  beforeEach(() => {
    resetInMemoryRateLimit();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("allows requests within the window and blocks the next one", () => {
    expect(
      checkInMemoryRateLimit("key", { limit: 2, windowMs: 60_000 }).allowed,
    ).toBe(true);
    expect(
      checkInMemoryRateLimit("key", { limit: 2, windowMs: 60_000 }).allowed,
    ).toBe(true);
    expect(
      checkInMemoryRateLimit("key", { limit: 2, windowMs: 60_000 }).allowed,
    ).toBe(false);
  });

  it("resets after the window", () => {
    checkInMemoryRateLimit("key", { limit: 1, windowMs: 60_000 });
    expect(
      checkInMemoryRateLimit("key", { limit: 1, windowMs: 60_000 }).allowed,
    ).toBe(false);

    vi.setSystemTime(new Date("2026-06-16T12:01:01Z"));

    expect(
      checkInMemoryRateLimit("key", { limit: 1, windowMs: 60_000 }).allowed,
    ).toBe(true);
  });

  it("uses the first forwarded IP for request keys", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
    });

    expect(rateLimitKeyFromHeaders(headers, "randomQuote")).toBe(
      "randomQuote:203.0.113.9",
    );
  });

  it("evicts expired buckets instead of growing without bound", () => {
    const options = { limit: 5, windowMs: 60_000 };
    for (let i = 0; i < MAX_IN_MEMORY_BUCKETS; i += 1) {
      checkInMemoryRateLimit(`ip-${i}`, options);
    }
    expect(inMemoryRateLimitSize()).toBe(MAX_IN_MEMORY_BUCKETS);

    vi.setSystemTime(new Date("2026-06-16T12:01:01Z"));
    checkInMemoryRateLimit("fresh", options);

    expect(inMemoryRateLimitSize()).toBe(1);
  });

  it("caps live buckets by dropping the oldest ones", () => {
    const options = { limit: 5, windowMs: 60_000 };
    for (let i = 0; i <= MAX_IN_MEMORY_BUCKETS + 10; i += 1) {
      checkInMemoryRateLimit(`ip-${i}`, options);
    }

    expect(inMemoryRateLimitSize()).toBeLessThanOrEqual(MAX_IN_MEMORY_BUCKETS);
  });

  it("falls back to memory when the Upstash request throws", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await checkRandomQuoteRateLimit(
      new Headers({ "x-forwarded-for": "203.0.113.9" }),
    );

    expect(result.allowed).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });

  it("limits votes per user, not per IP", async () => {
    for (let i = 0; i < 30; i += 1) {
      expect((await checkVoteRateLimit("user-1")).allowed).toBe(true);
    }
    expect((await checkVoteRateLimit("user-1")).allowed).toBe(false);
    expect((await checkVoteRateLimit("user-2")).allowed).toBe(true);
  });
});
