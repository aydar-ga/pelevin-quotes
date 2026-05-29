"use client";

import { X } from "lucide-react";
import SignInForm from "./SignInForm";

interface SignInPanelProps {
  open: boolean;
  onClose: () => void;
  callbackURL?: string;
  hint?: string;
}

export default function SignInPanel({
  open,
  onClose,
  callbackURL = "/?welcome=1",
  hint,
}: SignInPanelProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-panel-title"
        className="animate-slide-in fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--card-border)] bg-[var(--background)] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="sign-in-panel-title"
              className="text-2xl font-bold text-[var(--foreground)]"
            >
              Вход
            </h2>
            {hint && (
              <p className="mt-2 text-sm text-[var(--muted)]">{hint}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Закрыть панель"
            onClick={onClose}
            className="rounded-full border border-[var(--card-border)] p-2 hover:opacity-80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SignInForm callbackURL={callbackURL} />
        {process.env.NEXT_PUBLIC_DEV_TEST_AUTH === "true" && (
          <p className="mt-6 text-center">
            <a
              href="/dev/login"
              className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
            >
              Dev: войти как тестовый пользователь
            </a>
          </p>
        )}
      </aside>
    </>
  );
}
