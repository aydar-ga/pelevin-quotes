"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { signIn } from "@/lib/auth-client";

type Status = "idle" | "sending" | "sent" | "error";
type Mode = "sign-in" | "sign-up";

interface SignInFormProps {
  callbackURL?: string;
}

export default function SignInForm({
  callbackURL = "/?welcome=1",
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("sign-in");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    const trimmedName = name.trim();
    const payload =
      mode === "sign-up"
        ? {
            email,
            name: trimmedName,
            callbackURL,
            newUserCallbackURL: callbackURL,
            metadata: { intent: mode },
          }
        : {
            email,
            callbackURL,
            metadata: { intent: mode },
          };
    const { error } = await signIn.magicLink(payload);
    if (error) {
      setStatus("error");
      setErrorMessage(
        mode === "sign-in"
          ? "Почта не нашлась. Если ты впервые здесь — жми регистрацию."
          : error.message ?? "Что-то пошло не так. Попробуй ещё раз.",
      );
      return;
    }
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div
        role="status"
        className="animate-fade-in w-full max-w-md py-4 text-center text-[var(--foreground)]"
      >
        <Mail className="mx-auto mb-3 h-8 w-8 animate-pulse-soft text-[var(--accent)]" />
        <p className="text-lg font-semibold">Проверь почту</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ссылка улетела на <strong>{email}</strong>. Живёт 15&nbsp;минут,
          после клика вернёшься на главную.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-md text-[var(--foreground)]"
    >
      <div className="mb-6 grid grid-cols-2 border-b border-[var(--card-border)]">
        <button
          type="button"
          aria-pressed={mode === "sign-in"}
          onClick={() => {
            setMode("sign-in");
            setErrorMessage("");
            setStatus("idle");
          }}
          className={`border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
            mode === "sign-in"
              ? "border-[var(--foreground)] text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Войти
        </button>
        <button
          type="button"
          aria-pressed={mode === "sign-up"}
          onClick={() => {
            setMode("sign-up");
            setErrorMessage("");
            setStatus("idle");
          }}
          className={`border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
            mode === "sign-up"
              ? "border-[var(--foreground)] text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Зарегаться
        </button>
      </div>
      {mode === "sign-up" && (
        <>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Имя
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Как зовут?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-md border border-[var(--card-border)] bg-transparent px-3 py-2 text-base outline-none focus:border-[var(--accent)]"
          />
        </>
      )}
      <label htmlFor="email" className="mb-2 block text-sm font-medium">
        Почта
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-[var(--card-border)] bg-transparent px-3 py-2 text-base outline-none focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={
          status === "sending" ||
          !email ||
          (mode === "sign-up" && !name.trim())
        }
        className="mt-4 flex w-full items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending"
          ? "Отправляем…"
          : mode === "sign-up"
            ? "Зарегаться"
            : "Войти"}
      </button>
      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {errorMessage}
        </p>
      )}
      <p className="mt-4 text-xs text-[var(--muted)]">
        Без паролей. Имя — только при регистрации.
      </p>
    </form>
  );
}
