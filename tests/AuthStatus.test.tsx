import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const useSession = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  useSession: () => useSession(),
  signOut: (...args: unknown[]) => signOut(...args),
}));

vi.mock("@/components/SignInPanel", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="sign-in-panel">panel</div> : null,
}));

vi.mock("@/components/AccountPanel", () => ({
  default: ({
    open,
    email,
    onSignOut,
  }: {
    open: boolean;
    email: string;
    onSignOut: () => void;
  }) =>
    open ? (
      <div data-testid="account-panel">
        <span data-testid="account-panel-email">{email}</span>
        <button type="button" onClick={onSignOut}>
          Выйти
        </button>
      </div>
    ) : null,
}));

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

import AuthStatus from "@/components/AuthStatus";

describe("AuthStatus", () => {
  beforeEach(() => {
    useSession.mockReset();
    signOut.mockReset();
    push.mockReset();
    refresh.mockReset();
    signOut.mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total: 3 }),
      }),
    );
  });

  it("opens the sign-in panel when not authenticated", async () => {
    useSession.mockReturnValue({ data: null, isPending: false });
    render(
      <AuthStatus signInOpen onSignInOpen={vi.fn()} onSignInClose={vi.fn()} />,
    );

    expect(screen.getByTestId("sign-in-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("opens the account panel with bookmarks when authenticated", async () => {
    useSession.mockReturnValue({
      data: { user: { email: "pelevin-e2e-test@mail.tm" } },
      isPending: false,
    });
    render(
      <AuthStatus accountOpen onAccountOpen={vi.fn()} onAccountClose={vi.fn()} />,
    );

    expect(screen.getByTestId("account-panel")).toBeInTheDocument();
    expect(screen.getByTestId("account-panel-email")).toHaveTextContent(
      "pelevin-e2e-test@mail.tm",
    );
    expect(
      screen.queryByRole("menuitem", { name: /закладки/i }),
    ).not.toBeInTheDocument();
  });

  it("opens account panel when the profile button is clicked", async () => {
    useSession.mockReturnValue({
      data: { user: { email: "pelevin-e2e-test@mail.tm" } },
      isPending: false,
    });
    const onAccountOpen = vi.fn();
    render(<AuthStatus onAccountOpen={onAccountOpen} onAccountClose={vi.fn()} />);

    await userEvent.click(screen.getByTestId("auth-menu-trigger"));
    expect(onAccountOpen).toHaveBeenCalled();
  });

  it("signs out and refreshes the home page", async () => {
    useSession.mockReturnValue({
      data: { user: { email: "pelevin-e2e-test@mail.tm" } },
      isPending: false,
    });
    render(
      <AuthStatus accountOpen onAccountOpen={vi.fn()} onAccountClose={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Выйти" }));

    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });
});
