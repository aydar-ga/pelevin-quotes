"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";

const shellClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm transition-colors hover:opacity-80";

function truncateEmail(email: string, max = 28): string {
  if (email.length <= max) return email;
  const [local, domain] = email.split("@");
  if (!domain) return `${email.slice(0, max - 1)}…`;
  const keep = max - domain.length - 2;
  if (keep < 4) return `${email.slice(0, max - 1)}…`;
  return `${local.slice(0, keep)}…@${domain}`;
}

export default function AuthStatus() {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (isPending) {
    return (
      <div
        aria-hidden
        className={`fixed top-4 right-16 ${shellClass} opacity-50`}
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/sign-in"
        aria-label="Войти"
        className={`fixed top-4 right-16 ${shellClass}`}
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  const email = session.user.email ?? "";

  return (
    <div ref={menuRef} className="fixed top-4 right-16">
      <button
        type="button"
        data-testid="auth-menu-trigger"
        aria-label="Аккаунт"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`${shellClass} border-[var(--accent)]`}
      >
        <User className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-lg"
        >
          <p className="text-xs text-[var(--muted)]">Ты вошёл как</p>
          <p
            data-testid="signed-in-email"
            className="mt-1 text-sm font-semibold break-all"
            title={email}
          >
            {truncateEmail(email)}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--card-border)] px-3 py-2 text-sm font-medium hover:opacity-80"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
