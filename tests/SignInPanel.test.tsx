import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/SignInForm", () => ({
  default: () => <div data-testid="sign-in-form">form</div>,
}));

import SignInPanel from "@/components/SignInPanel";

describe("SignInPanel", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <SignInPanel open={false} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the sign-in dialog when open", () => {
    render(<SignInPanel open onClose={vi.fn()} hint="Hint text" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Hint text")).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-form")).toBeInTheDocument();
  });

  it("closes when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(<SignInPanel open onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(onClose).toHaveBeenCalled();
  });
});
