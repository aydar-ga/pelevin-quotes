"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { signIn } from "@/lib/auth-client";

type Status = "idle" | "sending" | "sent" | "error";

interface SignInFormProps {
  callbackURL?: string;
}

export default function SignInForm({ callbackURL = "/" }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    const { error } = await signIn.magicLink({ email, callbackURL });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Что-то пошло не так. Попробуй ещё раз.");
      return;
    }
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div
        role="status"
        className="w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-[var(--foreground)]"
      >
        <Mail className="mx-auto mb-3 h-8 w-8" />
        <p className="text-lg font-semibold">Проверь почту</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Мы отправили ссылку на <strong>{email}</strong>. Ссылка действует
          15&nbsp;минут.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 text-[var(--foreground)]"
    >
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
        disabled={status === "sending" || !email}
        className="mt-4 flex w-full items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "Отправляем…" : "Прислать ссылку"}
      </button>
      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {errorMessage}
        </p>
      )}
      <p className="mt-4 text-xs text-[var(--muted)]">
        Без паролей. Мы пришлём одноразовую ссылку для входа.
      </p>
    </form>
  );
}
