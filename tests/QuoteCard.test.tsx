import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

vi.mock("@/components/BookmarkButton", () => ({
  default: ({
    onSignInRequired,
  }: {
    onSignInRequired: () => void;
  }) => (
    <button type="button" onClick={onSignInRequired}>
      Bookmark
    </button>
  ),
}));

vi.mock("@/components/QuoteActions", () => ({
  default: () => <div data-testid="quote-actions">actions</div>,
}));

import QuoteCard from "@/components/QuoteCard";

describe("QuoteCard", () => {
  it("renders the quote text wrapped in quotes", () => {
    render(<QuoteCard quote="Жить надо чисто." book="Generation П" />);
    expect(screen.getByText(/Жить надо чисто/)).toBeInTheDocument();
  });

  it("renders the book attribution when provided", () => {
    render(<QuoteCard quote="Test." book="Empire V" />);
    expect(screen.getByText("- Empire V")).toBeInTheDocument();
  });

  it("hides the attribution when book is empty", () => {
    render(<QuoteCard quote="Test." book="" empty />);
    expect(screen.getByText(/"Test\."/)).toBeInTheDocument();
    expect(screen.queryByText(/^- /)).not.toBeInTheDocument();
  });

  it("announces quote updates via aria-live", () => {
    render(<QuoteCard quote="Test." book="Book" />);
    expect(screen.getByText(/"Test\."/)).toHaveAttribute("aria-live", "polite");
  });
});
