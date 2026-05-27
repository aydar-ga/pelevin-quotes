import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorBanner from "@/components/ErrorBanner";

describe("ErrorBanner", () => {
  it("shows the message inside an alert role", () => {
    render(<ErrorBanner message="Boom" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Boom");
  });

  it("renders a retry button only when onRetry is supplied", () => {
    const { rerender } = render(<ErrorBanner message="x" />);
    expect(screen.queryByRole("button")).toBeNull();

    rerender(<ErrorBanner message="x" onRetry={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    render(<ErrorBanner message="x" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
