import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/components/AuthStatus", () => ({
  default: () => (
    <a href="/sign-in" aria-label="Войти" className="fixed top-4 right-16">
      Sign in
    </a>
  ),
}));

describe("Home", () => {
  it("shows a minimal sign-in icon link on the right", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: "Войти" });
    expect(link).toHaveAttribute("href", "/sign-in");
    expect(link.className).toContain("right-16");
  });
});
