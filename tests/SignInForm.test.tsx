import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const signInMagicLink = vi.fn();

function submitButton(name: string) {
  return screen.getAllByRole("button", { name }).at(-1)!;
}

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
    render(<SignInForm />);

    await userEvent.type(
      screen.getByLabelText(/почта/i),
      "test@example.com",
    );
    await userEvent.click(submitButton("Войти"));

    expect(signInMagicLink).toHaveBeenCalledWith({
      email: "test@example.com",
      callbackURL: "/?welcome=1",
      metadata: { intent: "sign-in" },
    });
    expect(await screen.findByText(/проверь почту/i)).toBeInTheDocument();
  });

  it("requires a name only in sign-up mode and sends it with the magic link", async () => {
    signInMagicLink.mockResolvedValueOnce({ data: { ok: true }, error: null });
    render(<SignInForm />);

    await userEvent.click(
      screen.getByRole("button", { name: /зарегаться/i }),
    );
    await userEvent.type(screen.getByLabelText(/имя/i), "Aydar");
    await userEvent.type(
      screen.getByLabelText(/почта/i),
      "new@example.com",
    );
    await userEvent.click(submitButton("Зарегаться"));

    expect(signInMagicLink).toHaveBeenCalledWith({
      email: "new@example.com",
      name: "Aydar",
      callbackURL: "/?welcome=1",
      newUserCallbackURL: "/?welcome=1",
      metadata: { intent: "sign-up" },
    });
  });

  it("does not ask for a name in login mode", () => {
    render(<SignInForm />);
    expect(screen.queryByLabelText(/имя/i)).not.toBeInTheDocument();
  });

  it("uses compact auth copy", async () => {
    render(<SignInForm />);
    expect(screen.getAllByRole("button", { name: "Войти" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Зарегаться" })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Зарегаться" }),
    );

    expect(screen.getByPlaceholderText("Как зовут?")).toBeInTheDocument();
    expect(screen.getByText(/имя — только при регистрации/i)).toBeInTheDocument();
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
    await userEvent.click(submitButton("Войти"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /почта не нашлась/i,
    );
  });

  it("disables the submit button until an email is typed", () => {
    render(<SignInForm />);
    expect(submitButton("Войти")).toBeDisabled();
  });
});
