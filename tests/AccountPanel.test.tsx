import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AccountPanel from "@/components/AccountPanel";

const items = [
  { id: 1, text: "Герой — зритель, обученный хлопать.", book: "S.N.U.F.F.", author: "Пелевин" },
  { id: 2, text: "Другая цитата.", book: "S.N.U.F.F.", author: "Пелевин" },
  { id: 3, text: "Третья.", book: "Generation П", author: "Пелевин" },
];

describe("AccountPanel", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items, total: items.length }),
      }),
    );
  });

  it("renders account email and grouped bookmark sections", async () => {
    render(
      <AccountPanel
        open
        onClose={vi.fn()}
        email="pelevin-e2e-test@mail.tm"
        onSignOut={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-panel-email")).toHaveTextContent(
      "pelevin-e2e-test@mail.tm",
    );

    await waitFor(() => {
      expect(screen.getByText("S.N.U.F.F.")).toBeInTheDocument();
      expect(screen.getByText("Generation П")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/герой — зритель, обученный хлопать/i),
    ).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(
      <AccountPanel
        open
        onClose={onClose}
        email="user@test.local"
        onSignOut={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("removes a bookmark and updates the count", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items, total: items.length }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bookmarked: false, total: 2 }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const onBookmarkCountChange = vi.fn();
    render(
      <AccountPanel
        open
        onClose={vi.fn()}
        email="user@test.local"
        onSignOut={vi.fn()}
        onBookmarkCountChange={onBookmarkCountChange}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/герой — зритель, обученный хлопать/i),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getAllByRole("button", { name: /убрать из закладок/i })[0],
    );

    await waitFor(() => {
      expect(
        screen.queryByText(/герой — зритель, обученный хлопать/i),
      ).not.toBeInTheDocument();
    });
    expect(onBookmarkCountChange).toHaveBeenCalledWith(2);
  });

  it("shows empty state when there are no bookmarks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0 }),
      }),
    );

    render(
      <AccountPanel
        open
        onClose={vi.fn()}
        email="user@test.local"
        onSignOut={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/пока пусто/i)).toBeInTheDocument();
    });
  });
});
