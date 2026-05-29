import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: "user-1" } },
    isPending: false,
  })),
}));

vi.mock("@/components/SignInPanel", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="sign-in-panel">sign-in</div> : null,
}));

import QuoteView from "@/components/QuoteView";

describe("QuoteView", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("toggles bookmark state after a successful API call", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ bookmarked: true }),
    } as Response);

    render(
      <QuoteView
        id={7}
        text="Test quote"
        book="Book"
        initialBookmarked={false}
      />,
    );

    await userEvent.click(screen.getByTestId("bookmark-button"));

    await waitFor(() => {
      expect(screen.getByTestId("bookmark-button")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("opens sign-in panel when bookmark API returns 401", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    render(
      <QuoteView
        id={7}
        text="Test quote"
        book="Book"
        initialBookmarked={false}
      />,
    );

    await userEvent.click(screen.getByTestId("bookmark-button"));

    expect(await screen.findByTestId("sign-in-panel")).toBeInTheDocument();
  });

  it("shows permalink link for the quote", () => {
    render(
      <QuoteView
        id={7}
        text="Test quote"
        book="Book"
        initialBookmarked={false}
      />,
    );

    expect(screen.getByRole("link", { name: /открыть цитату/i })).toHaveAttribute(
      "href",
      "/q/7",
    );
  });
});
