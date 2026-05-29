"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";

interface WelcomeBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function WelcomeBanner({ visible, onDismiss }: WelcomeBannerProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="animate-fade-in fixed top-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-[var(--accent)] bg-[var(--card)] px-4 py-3 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div className="flex-1">
          <p className="font-semibold text-[var(--foreground)]">
            Добро пожаловать!
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Теперь можно сохранять понравившиеся цитаты в закладки.
          </p>
        </div>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onDismiss}
          className="rounded-md p-1 hover:opacity-80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
