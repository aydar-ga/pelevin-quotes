"use client";

import { Heart } from "lucide-react";
import { iconActionClass } from "@/lib/icon-button";
import { sourceLabel, type BookmarkItem } from "@/lib/bookmark-ui";
import ShareQuoteButton from "./ShareQuoteButton";

interface BookmarkRowProps {
  item: BookmarkItem;
  onRemove: (quoteId: number) => void;
  busy?: boolean;
}

export default function BookmarkRow({ item, onRemove, busy }: BookmarkRowProps) {
  return (
    <article className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)]/60 px-4 py-3 transition-colors hover:border-[var(--muted)]/40">
      <p className="line-clamp-3 text-sm leading-relaxed text-[var(--foreground)]">
        &ldquo;{item.text}&rdquo;
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-[var(--muted)]">
          {sourceLabel(item.book)}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Убрать из закладок"
            disabled={busy}
            onClick={() => onRemove(item.id)}
            className={`${iconActionClass} border-red-500/30 text-red-400 hover:bg-red-500/10`}
          >
            <Heart className="h-4 w-4 fill-current" aria-hidden />
          </button>
          <ShareQuoteButton
            quoteId={item.id}
            quote={item.text}
            book={item.book}
          />
        </div>
      </div>
    </article>
  );
}
