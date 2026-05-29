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

  it("opens an account menu with bookmarks link", async () => {
    useSession.mockReturnValue({
      data: { user: { email: "pelevin-e2e-test@mail.tm" } },
      isPending: false,
    });
    render(<AuthStatus />);

    await userEvent.click(screen.getByTestId("auth-menu-trigger"));

    expect(screen.getByTestId("signed-in-email")).toHaveTextContent(
      "pelevin-e2e-test@mail.tm",
    );
    expect(screen.getByRole("menuitem", { name: /закладки/i })).toHaveAttribute(
      "href",
      "/bookmarks",
    );
    expect(
      screen.queryByText(/ты вошёл как/i),
    ).not.toBeInTheDocument();
  });

  it("signs out and refreshes the home page", async () => {
    useSession.mockReturnValue({
      data: { user: { email: "pelevin-e2e-test@mail.tm" } },
      isPending: false,
    });
    render(<AuthStatus />);

    await userEvent.click(screen.getByTestId("auth-menu-trigger"));
    await userEvent.click(screen.getByRole("menuitem", { name: /выйти/i }));

    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });
});
