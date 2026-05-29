"use client";

import { ExternalLink, Heart } from "lucide-react";
import Link from "next/link";
import { iconActionClass } from "@/lib/icon-button";
import type { BookmarkItem } from "@/lib/bookmark-ui";

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
      <div className="mt-3 flex items-center justify-end gap-1">
        <button
          type="button"
          aria-label="Убрать из закладок"
          disabled={busy}
          onClick={() => onRemove(item.id)}
          className={`${iconActionClass} border-red-500/30 text-red-400 hover:bg-red-500/10`}
        >
          <Heart className="h-4 w-4 fill-current" aria-hidden />
        </button>
        <Link
          href={`/q/${item.id}`}
          aria-label="Открыть цитату"
          className={iconActionClass}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
