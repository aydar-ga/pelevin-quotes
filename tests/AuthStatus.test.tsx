import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const useSession = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  useSession: () => useSession(),
  signOut: (...args: unknown[]) => signOut(...args),
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
  });

  it("shows a sign-in link when there is no session", () => {
    useSession.mockReturnValue({ data: null, isPending: false });
    render(<AuthStatus />);

    const link = screen.getByRole("link", { name: "Войти" });
    expect(link).toHaveAttribute("href", "/sign-in");
  });

  it("opens an account menu with the signed-in email", async () => {
    useSession.mockReturnValue({
      data: { user: { email: "pelevin-e2e-test@mail.tm" } },
      isPending: false,
    });
    render(<AuthStatus />);

    await userEvent.click(screen.getByTestId("auth-menu-trigger"));

    expect(screen.getByTestId("signed-in-email")).toHaveTextContent(
      "pelevin-e2e-test@mail.tm",
    );
    expect(screen.getByRole("menuitem", { name: /выйти/i })).toBeInTheDocument();
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
