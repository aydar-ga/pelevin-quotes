import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomeClient from "@/app/HomeClient";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/AuthStatus", () => ({
  default: () => (
    <button type="button" aria-label="Войти">
      Sign in
    </button>
  ),
}));

describe("HomeClient", () => {
  it("shows a sign-in control in the header area", () => {
    render(<HomeClient />);
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("fetches a quote when Space is pressed", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, text: "Test quote", book: "Book" }),
    });

    render(<HomeClient />);
    await user.keyboard(" ");

    expect(global.fetch).toHaveBeenCalledWith("/api/randomQuote", {
      cache: "no-store",
    });
  });
});
