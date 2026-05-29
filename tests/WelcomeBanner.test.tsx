import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WelcomeBanner from "@/components/WelcomeBanner";

describe("WelcomeBanner", () => {
  it("shows welcome copy when visible", () => {
    render(<WelcomeBanner visible onDismiss={vi.fn()} />);
    expect(screen.getByText(/добро пожаловать/i)).toBeInTheDocument();
    expect(screen.getByText(/закладки/i)).toBeInTheDocument();
  });

  it("calls onDismiss when closed", async () => {
    const onDismiss = vi.fn();
    render(<WelcomeBanner visible onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: /закрыть/i }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
