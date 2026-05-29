import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } }, isPending: false }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

  it("shows bookmark and permalink actions when a quote is loaded", () => {
    render(
      <QuoteCard
        quote="Loaded."
        book="Book"
        quoteId={9}
        bookmarked={false}
        onBookmarkToggle={vi.fn()}
      />,
    );

    expect(screen.getByTestId("bookmark-button")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /открыть цитату/i })).toHaveAttribute(
      "href",
      "/q/9",
    );
  });

  it("hides actions in the empty placeholder state", () => {
    render(
      <QuoteCard quote="Placeholder" book="" empty quoteId={null} />,
    );

    expect(screen.queryByTestId("bookmark-button")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /открыть цитату/i }),
    ).not.toBeInTheDocument();
  });
});
