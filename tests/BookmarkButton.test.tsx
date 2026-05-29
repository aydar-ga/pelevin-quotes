import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const useSession = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  useSession: () => useSession(),
}));

import BookmarkButton from "@/components/BookmarkButton";

describe("BookmarkButton", () => {
  beforeEach(() => {
    useSession.mockReset();
  });

  it("opens sign-in flow when user is not logged in", async () => {
    useSession.mockReturnValue({ data: null, isPending: false });
    const onSignInRequired = vi.fn();
    render(
      <BookmarkButton
        quoteId={42}
        bookmarked={false}
        onToggle={vi.fn()}
        onSignInRequired={onSignInRequired}
      />,
    );

    await userEvent.click(screen.getByTestId("bookmark-button"));
    expect(onSignInRequired).toHaveBeenCalled();
  });

  it("toggles bookmark when user is logged in", async () => {
    useSession.mockReturnValue({
      data: { user: { id: "u1" } },
      isPending: false,
    });
    const onToggle = vi.fn();
    render(
      <BookmarkButton
        quoteId={42}
        bookmarked={false}
        onToggle={onToggle}
        onSignInRequired={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByTestId("bookmark-button"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("reflects bookmarked state", () => {
    useSession.mockReturnValue({
      data: { user: { id: "u1" } },
      isPending: false,
    });
    render(
      <BookmarkButton
        quoteId={42}
        bookmarked
        onToggle={vi.fn()}
        onSignInRequired={vi.fn()}
      />,
    );

    expect(screen.getByTestId("bookmark-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
