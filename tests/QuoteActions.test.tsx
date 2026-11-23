import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } }, isPending: false }),
}));

import QuoteActions from "@/components/QuoteActions";

describe("QuoteActions", () => {
  it("renders a share control for a quote permalink", () => {
    render(<QuoteActions quoteId={42} quote="Test quote" book="Book" />);

    expect(
      screen.getByRole("button", { name: /поделиться цитатой/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "В плюс" })).toBeInTheDocument();
  });

  it("renders nothing when quote id is missing", () => {
    const { container } = render(
      <QuoteActions quoteId={null} quote="x" book="" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for empty placeholder quotes", () => {
    const { container } = render(
      <QuoteActions quoteId={1} quote="x" book="" empty />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
