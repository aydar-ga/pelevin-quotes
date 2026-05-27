import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
    const { container } = render(<QuoteCard quote="Test." book="" />);
    expect(container.querySelector("p:last-child")?.textContent).toMatch(
      /^"Test\."$/,
    );
  });
});
