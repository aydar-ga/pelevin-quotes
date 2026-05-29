import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const signInMagicLink = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    magicLink: (...args: unknown[]) => signInMagicLink(...args),
  },
  signOut: vi.fn(),
  useSession: vi.fn(),
  getSession: vi.fn(),
  authClient: {},
}));

import SignInForm from "@/components/SignInForm";

describe("SignInForm", () => {
  beforeEach(() => {
    signInMagicLink.mockReset();
  });

  it("submits the email and shows the 'check your mail' state on success", async () => {
    signInMagicLink.mockResolvedValueOnce({ data: { ok: true }, error: null });
    render(<SignInForm callbackURL="/" />);

    await userEvent.type(
      screen.getByLabelText(/почта/i),
      "test@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /прислать/i }));

    expect(signInMagicLink).toHaveBeenCalledWith({
      email: "test@example.com",
      callbackURL: "/",
    });
    expect(await screen.findByText(/проверь почту/i)).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows an error message when the magic link call fails", async () => {
    signInMagicLink.mockResolvedValueOnce({
      data: null,
      error: { message: "Слишком много попыток" },
    });
    render(<SignInForm />);

    await userEvent.type(
      screen.getByLabelText(/почта/i),
      "boom@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /прислать/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /слишком много попыток/i,
    );
  });

  it("disables the submit button until an email is typed", () => {
    render(<SignInForm />);
    const button = screen.getByRole("button", { name: /прислать/i });
    expect(button).toBeDisabled();
  });
});
