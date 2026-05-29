import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const listBookmarks = vi.fn();
const countBookmarks = vi.fn();
const toggleBookmark = vi.fn();

vi.mock("@/lib/auth-server", () => ({
  getServerSession: () => getServerSession(),
}));

vi.mock("@/lib/bookmarks", () => ({
  listBookmarks: (...args: unknown[]) => listBookmarks(...args),
  countBookmarks: (...args: unknown[]) => countBookmarks(...args),
  toggleBookmark: (...args: unknown[]) => toggleBookmark(...args),
}));

import { GET, POST } from "@/app/api/bookmarks/route";

describe("/api/bookmarks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when not authenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("GET returns items and total for authenticated users", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    listBookmarks.mockResolvedValue([{ id: 1, text: "Q", book: "B" }]);
    countBookmarks.mockResolvedValue(1);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [{ id: 1, text: "Q", book: "B" }],
      total: 1,
    });
  });

  it("POST returns 401 when not authenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ quoteId: 1 }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("POST returns 400 for invalid quoteId", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    const response = await POST(
      new Request("http://localhost/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ quoteId: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("POST toggles bookmark and returns updated state", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    toggleBookmark.mockResolvedValue(true);
    countBookmarks.mockResolvedValue(2);

    const response = await POST(
      new Request("http://localhost/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ quoteId: 5 }),
      }),
    );
    const body = await response.json();

    expect(toggleBookmark).toHaveBeenCalledWith("user-1", 5);
    expect(response.status).toBe(200);
    expect(body).toEqual({ bookmarked: true, total: 2, quoteId: 5 });
  });
});
