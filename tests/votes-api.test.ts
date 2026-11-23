import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const setQuoteVote = vi.fn();
const checkVoteRateLimit = vi.fn();

vi.mock("@/lib/auth-server", () => ({
  getServerSession: () => getServerSession(),
}));

vi.mock("@/lib/votes", () => ({
  isVoteValue: (value: unknown) => value === 1 || value === -1,
  setQuoteVote: (...args: unknown[]) => setQuoteVote(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkVoteRateLimit: (...args: unknown[]) => checkVoteRateLimit(...args),
  rateLimitHeaders: (result: { allowed: boolean }) =>
    result.allowed ? {} : { "Retry-After": "60" },
}));

import { POST } from "@/app/api/votes/route";

function voteRequest(body: string, contentType = "application/json") {
  return new Request("http://localhost/api/votes", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

describe("/api/votes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    checkVoteRateLimit.mockResolvedValue({
      allowed: true,
      limit: 30,
      remaining: 29,
      resetAt: Date.now() + 60_000,
    });
  });

  it("returns 401 when not authenticated", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(
      voteRequest(JSON.stringify({ quoteId: 1, value: 1 })),
    );

    expect(response.status).toBe(401);
    expect(setQuoteVote).not.toHaveBeenCalled();
  });

  it.each([
    ["a zero value", JSON.stringify({ quoteId: 1, value: 0 })],
    ["a string value", JSON.stringify({ quoteId: 1, value: "1" })],
    ["a fractional quoteId", JSON.stringify({ quoteId: 1.5, value: 1 })],
    ["a negative quoteId", JSON.stringify({ quoteId: -3, value: 1 })],
    ["an oversized quoteId", JSON.stringify({ quoteId: 2 ** 31, value: 1 })],
    ["malformed JSON", "{oops"],
    ["a JSON null body", "null"],
  ])("returns 400 for %s", async (_label, body) => {
    const response = await POST(voteRequest(body));

    expect(response.status).toBe(400);
    expect(setQuoteVote).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON content type", async () => {
    const response = await POST(
      voteRequest(JSON.stringify({ quoteId: 1, value: 1 }), "text/plain"),
    );

    expect(response.status).toBe(400);
    expect(setQuoteVote).not.toHaveBeenCalled();
  });

  it("returns 429 when the user exceeds the vote rate limit", async () => {
    checkVoteRateLimit.mockResolvedValue({
      allowed: false,
      limit: 30,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const response = await POST(
      voteRequest(JSON.stringify({ quoteId: 7, value: 1 })),
    );

    expect(checkVoteRateLimit).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(setQuoteVote).not.toHaveBeenCalled();
  });

  it("returns 404 when the quote does not exist", async () => {
    setQuoteVote.mockResolvedValue(null);

    const response = await POST(
      voteRequest(JSON.stringify({ quoteId: 999999, value: 1 })),
    );

    expect(response.status).toBe(404);
  });

  it("stores a vote and returns the updated summary", async () => {
    setQuoteVote.mockResolvedValue({
      quoteId: 7,
      score: 3,
      upvotes: 4,
      downvotes: 1,
      userVote: 1,
    });

    const response = await POST(
      voteRequest(JSON.stringify({ quoteId: 7, value: 1 })),
    );
    const body = await response.json();

    expect(setQuoteVote).toHaveBeenCalledWith("user-1", 7, 1);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      quoteId: 7,
      score: 3,
      upvotes: 4,
      downvotes: 1,
      userVote: 1,
    });
  });
});
