import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSession = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  useSession: () => useSession(),
}));

import VoteButtons from "@/components/VoteButtons";

describe("VoteButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    useSession.mockReturnValue({
      data: { user: { id: "user-1" } },
      isPending: false,
    });
  });

  it("opens sign-in instead of voting for guests", async () => {
    const onSignInRequired = vi.fn();
    useSession.mockReturnValue({ data: null, isPending: false });

    render(
      <VoteButtons
        quoteId={7}
        score={0}
        upvotes={0}
        downvotes={0}
        userVote={0}
        onSignInRequired={onSignInRequired}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "В плюс" }));

    expect(onSignInRequired).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("updates score after a successful upvote", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        quoteId: 7,
        score: 5,
        upvotes: 6,
        downvotes: 1,
        userVote: 1,
      }),
    } as Response);

    render(
      <VoteButtons
        quoteId={7}
        score={0}
        upvotes={0}
        downvotes={0}
        userVote={0}
        onSignInRequired={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "В плюс" }));

    await waitFor(() => {
      expect(screen.getByText("+5")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "В плюс" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("toggles an existing downvote off", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        quoteId: 7,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        userVote: 0,
      }),
    } as Response);

    render(
      <VoteButtons
        quoteId={7}
        score={-1}
        upvotes={0}
        downvotes={1}
        userVote={-1}
        onSignInRequired={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "В минус" }));

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "В минус" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows the new quote's numbers when the parent swaps the quote", () => {
    const { rerender } = render(
      <VoteButtons
        quoteId={7}
        score={0}
        upvotes={0}
        downvotes={0}
        userVote={0}
        onSignInRequired={vi.fn()}
      />,
    );

    rerender(
      <VoteButtons
        quoteId={8}
        score={4}
        upvotes={5}
        downvotes={1}
        userVote={1}
        onSignInRequired={vi.fn()}
      />,
    );

    expect(screen.getByTestId("vote-score")).toHaveTextContent("+4");
    expect(screen.getByRole("button", { name: "В плюс" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not leave a vote from the previous quote on the next one", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        quoteId: 7,
        score: 1,
        upvotes: 1,
        downvotes: 0,
        userVote: 1,
      }),
    } as Response);
    const { rerender } = render(
      <VoteButtons
        quoteId={7}
        score={0}
        upvotes={0}
        downvotes={0}
        userVote={0}
        onSignInRequired={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "В плюс" }));
    await waitFor(() => {
      expect(screen.getByTestId("vote-score")).toHaveTextContent("+1");
    });

    rerender(
      <VoteButtons
        quoteId={8}
        score={0}
        upvotes={0}
        downvotes={0}
        userVote={0}
        onSignInRequired={vi.fn()}
      />,
    );

    expect(screen.getByTestId("vote-score")).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "В плюс" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("re-enables voting after a network failure without crashing", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    render(
      <VoteButtons
        quoteId={7}
        score={2}
        upvotes={2}
        downvotes={0}
        userVote={0}
        onSignInRequired={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "В плюс" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "В плюс" })).toBeEnabled();
    });
    expect(screen.getByTestId("vote-score")).toHaveTextContent("+2");
  });
});
