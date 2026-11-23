import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BookmarkRow from "@/components/BookmarkRow";

const item = {
  id: 42,
  text: "Герой — зритель, обученный хлопать.",
  book: "S.N.U.F.F.",
  author: "Пелевин",
};

describe("BookmarkRow", () => {
  it("renders quote text, source, and share button", () => {
    render(<BookmarkRow item={item} onRemove={vi.fn()} />);

    expect(
      screen.getByText(/герой — зритель, обученный хлопать/i),
    ).toBeInTheDocument();
    expect(screen.getByText("S.N.U.F.F.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /поделиться цитатой/i }),
    ).toBeInTheDocument();
  });

  it("calls onRemove when heart is clicked", async () => {
    const onRemove = vi.fn();
    render(<BookmarkRow item={item} onRemove={onRemove} />);

    await userEvent.click(
      screen.getByRole("button", { name: /убрать из закладок/i }),
    );
    expect(onRemove).toHaveBeenCalledWith(42);
  });
});
