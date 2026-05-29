"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import AccountPanel from "./AccountPanel";
import SignInPanel from "./SignInPanel";

const shellClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm transition-colors hover:opacity-80";

interface AuthStatusProps {
  onSignInOpen?: () => void;
  signInOpen?: boolean;
  onSignInClose?: () => void;
  signInHint?: string;
  accountOpen?: boolean;
  onAccountOpen?: () => void;
  onAccountClose?: () => void;
}

export default function AuthStatus({
  onSignInOpen,
  signInOpen = false,
  onSignInClose,
  signInHint,
  accountOpen = false,
  onAccountOpen,
  onAccountClose,
}: AuthStatusProps) {
  const { data: session, isPending } = useSession();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const router = useRouter();
  const activeBookmarkCount = session?.user ? bookmarkCount : 0;

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

  const handleSignOut = async () => {
    onAccountClose?.();
    await signOut();
    router.push("/");
    router.refresh();
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
          onClick={() => onSignInOpen?.()}
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
    <>
      <button
        type="button"
        data-testid="auth-menu-trigger"
        aria-label="Аккаунт и закладки"
        aria-expanded={accountOpen}
        onClick={() => onAccountOpen?.()}
        className={`fixed top-4 right-16 ${shellClass} border-[var(--accent)]/40`}
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
      <AccountPanel
        open={accountOpen}
        onClose={() => onAccountClose?.()}
        email={email}
        onSignOut={handleSignOut}
        onBookmarkCountChange={setBookmarkCount}
      />
    </>
  );
}
