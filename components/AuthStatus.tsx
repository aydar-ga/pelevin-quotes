"use client";

import { LogOut, Bookmark, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { iconActionClass } from "@/lib/icon-button";
import SignInPanel from "./SignInPanel";

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

interface AuthStatusProps {
  onSignInOpen?: () => void;
  signInOpen?: boolean;
  onSignInClose?: () => void;
  signInHint?: string;
}

export default function AuthStatus({
  onSignInOpen,
  signInOpen = false,
  onSignInClose,
  signInHint,
}: AuthStatusProps) {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const activeBookmarkCount = session?.user ? bookmarkCount : 0;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;
    fetch("/api/bookmarks", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { total?: number } | null) => {
        if (!cancelled && data?.total != null) setBookmarkCount(data.total);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const handleSignInClick = () => {
    onSignInOpen?.();
  };

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
      <>
        <button
          type="button"
          aria-label="Войти"
          onClick={handleSignInClick}
          className={`fixed top-4 right-16 ${shellClass}`}
        >
          <User className="h-5 w-5" />
        </button>
        <SignInPanel
          open={signInOpen}
          onClose={() => onSignInClose?.()}
          hint={signInHint}
        />
      </>
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
        className={`relative ${shellClass} border-[var(--accent)]`}
      >
        <User className="h-5 w-5" />
        {activeBookmarkCount > 0 && (
          <span
            data-testid="bookmark-count-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {activeBookmarkCount > 99 ? "99+" : activeBookmarkCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-52 rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-lg"
        >
          <p
            data-testid="signed-in-email"
            className="truncate text-sm font-medium text-[var(--foreground)]"
            title={email}
          >
            {truncateEmail(email)}
          </p>
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <Link
              href="/bookmarks"
              role="menuitem"
              aria-label={
                activeBookmarkCount > 0
                  ? `Закладки (${activeBookmarkCount})`
                  : "Закладки"
              }
              onClick={() => setOpen(false)}
              className={`${iconActionClass} relative`}
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              {activeBookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {activeBookmarkCount > 99 ? "99+" : activeBookmarkCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              role="menuitem"
              aria-label="Выйти"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.push("/");
                router.refresh();
              }}
              className={iconActionClass}
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
