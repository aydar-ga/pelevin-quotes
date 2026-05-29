import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const getServerSession = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

vi.mock("@/lib/auth-server", () => ({
  getServerSession: () => getServerSession(),
}));

import BookmarksPage from "@/app/bookmarks/page";

describe("BookmarksPage", () => {
  beforeEach(() => {
    redirect.mockReset();
  });

  it("redirects guests to sign-in", async () => {
    getServerSession.mockResolvedValue(null);

    await expect(BookmarksPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/?signIn=1");
  });

  it("redirects logged-in users to the account panel on home", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });

    await expect(BookmarksPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/?panel=account");
  });
});
