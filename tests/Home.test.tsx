import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeClient from "@/app/HomeClient";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/AuthStatus", () => ({
  default: ({
    accountOpen,
    signInOpen,
  }: {
    accountOpen?: boolean;
    signInOpen?: boolean;
  }) => (
    <div>
      {accountOpen && <div data-testid="account-panel-open">account</div>}
      {signInOpen && <div data-testid="sign-in-panel-open">sign-in</div>}
      <button type="button" aria-label="Войти">
        Sign in
      </button>
    </div>
  ),
}));

describe("HomeClient", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    mockReplace.mockReset();
    mockRefresh.mockReset();
  });

  it("shows a sign-in control in the header area", () => {
    render(<HomeClient />);
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("opens account panel when panel=account is in the URL", () => {
    searchParams = new URLSearchParams("panel=account");
    render(<HomeClient />);
    expect(screen.getByTestId("account-panel-open")).toBeInTheDocument();
  });

  it("opens sign-in panel when signIn=1 is in the URL", () => {
    searchParams = new URLSearchParams("signIn=1");
    render(<HomeClient />);
    expect(screen.getByTestId("sign-in-panel-open")).toBeInTheDocument();
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

  it("does not fetch a quote on Space when sign-in panel is open", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("signIn=1");
    global.fetch = vi.fn();

    render(<HomeClient />);
    await user.keyboard(" ");

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("loads a quote when the generate button is clicked", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, text: "Loaded quote", book: "Empire V" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bookmarked: false }),
      });

    render(<HomeClient />);
    await userEvent.click(
      screen.getByRole("button", { name: /давай цитатку/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/loaded quote/i)).toBeInTheDocument();
    });
  });
});
