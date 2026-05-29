"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import BookmarkRow from "./BookmarkRow";
import SidePanel from "./SidePanel";
import {
  emailInitial,
  groupBookmarksByBook,
  type BookmarkItem,
} from "@/lib/bookmark-ui";

interface AccountPanelProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onSignOut: () => void | Promise<void>;
  onBookmarkCountChange?: (count: number) => void;
}

export default function AccountPanel({
  open,
  onClose,
  email,
  onSignOut,
  onBookmarkCountChange,
}: AccountPanelProps) {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/bookmarks", { cache: "no-store" });
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as {
          items: BookmarkItem[];
          total: number;
        };
        if (cancelled) return;
        setItems(data.items);
        onBookmarkCountChange?.(data.total);
      } catch {
        if (!cancelled) setError("Не удалось загрузить закладки.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, onBookmarkCountChange]);

  const removeBookmark = async (quoteId: number) => {
    setBusyId(quoteId);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      if (!response.ok) return;
      setItems((current) => {
        const next = current.filter((item) => item.id !== quoteId);
        onBookmarkCountChange?.(next.length);
        return next;
      });
    } finally {
      setBusyId(null);
    }
  };

  const groups = groupBookmarksByBook(items);

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Аккаунт"
      titleId="account-panel-title"
    >
      <section
        aria-label="Профиль"
        className="shrink-0 border-b border-[var(--card-border)] px-6 py-5"
      >
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--accent-foreground)]"
          >
            {emailInitial(email)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              data-testid="account-panel-email"
              className="truncate text-sm font-medium text-[var(--foreground)]"
              title={email}
            >
              {email}
            </p>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Выйти
            </button>
          </div>
        </div>
      </section>

      <section
        aria-label="Закладки"
        className="flex min-h-0 flex-1 flex-col px-6 py-5"
      >
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Закладки
          </h3>
          {!loading && !error && (
            <span className="text-xs tabular-nums text-[var(--muted)]">
              {items.length}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading && (
            <p className="text-sm text-[var(--muted)]">Загружаем…</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              Пока пусто. Сохраняй цитаты сердечком на главной.
            </p>
          )}
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.book}>
                <h4 className="mb-2 text-xs font-medium text-[var(--foreground)]">
                  {group.book}
                </h4>
                <div className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <BookmarkRow
                      key={item.id}
                      item={item}
                      onRemove={removeBookmark}
                      busy={busyId === item.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SidePanel>
  );
}
