import { beforeEach, describe, expect, it, vi } from "vitest";

const checkRandomQuoteRateLimit = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();
const orderByMock = vi.fn();
const limitMock = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRandomQuoteRateLimit: (...args: unknown[]) =>
    checkRandomQuoteRateLimit(...args),
  rateLimitHeaders: (result: {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
  }) => ({
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { "Retry-After": "60" }),
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      selectMock(...args);
      return {
        from: (...fromArgs: unknown[]) => {
          fromMock(...fromArgs);
          return {
            orderBy: (...orderArgs: unknown[]) => {
              orderByMock(...orderArgs);
              return {
                limit: (...limitArgs: unknown[]) => limitMock(...limitArgs),
              };
            },
          };
        },
      };
    },
  },
}));

import { GET } from "@/app/api/randomQuote/route";

describe("/api/randomQuote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRandomQuoteRateLimit.mockResolvedValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAt: Date.now() + 60_000,
    });
    limitMock.mockResolvedValue([
      { id: 1, text: "Quote", book: "Book", author: "Author" },
    ]);
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    checkRandomQuoteRateLimit.mockResolvedValue({
      allowed: false,
      limit: 60,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const response = await GET(
      new Request("http://localhost/api/randomQuote", {
        headers: { "x-forwarded-for": "203.0.113.9" },
      }),
    );

    expect(response.status).toBe(429);
    expect(selectMock).not.toHaveBeenCalled();
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("returns rate limit headers with a successful quote", async () => {
    const response = await GET(
      new Request("http://localhost/api/randomQuote", {
        headers: { "x-forwarded-for": "203.0.113.9" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
  });
});
