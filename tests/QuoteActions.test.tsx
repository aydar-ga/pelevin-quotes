import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuoteActions from "@/components/QuoteActions";

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

describe("QuoteActions", () => {
  it("links to the quote permalink", () => {
    render(<QuoteActions quoteId={42} />);

    expect(screen.getByRole("link", { name: /открыть цитату/i })).toHaveAttribute(
      "href",
      "/q/42",
    );
  });

  it("renders nothing when quote id is missing", () => {
    const { container } = render(<QuoteActions quoteId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not show a copy control", () => {
    render(<QuoteActions quoteId={1} />);
    expect(
      screen.queryByRole("button", { name: /копировать/i }),
    ).not.toBeInTheDocument();
  });
});
