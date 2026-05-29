"use client";

import React from "react";
import PelevinIcon from "./PelevinIcon";
import QuoteActions from "./QuoteActions";
import BookmarkButton from "./BookmarkButton";

interface QuoteCardProps {
  quote: string;
  book: string;
  quoteId?: number | null;
  empty?: boolean;
  bookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onSignInRequired?: () => void;
  bookmarkBusy?: boolean;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  book,
  quoteId = null,
  empty,
  bookmarked = false,
  onBookmarkToggle,
  onSignInRequired,
  bookmarkBusy = false,
}) => {
  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 shadow-md">
      {empty && (
        <div className="mb-6 flex justify-center text-[var(--muted)]">
          <PelevinIcon size={96} />
        </div>
      )}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="mb-6 text-center text-lg text-[var(--foreground)]"
      >
        &quot;{quote}&quot;
      </p>
      {book && (
        <p className="text-right text-sm text-[var(--muted)]">- {book}</p>
      )}
      {!empty && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <BookmarkButton
            quoteId={quoteId}
            bookmarked={bookmarked}
            onToggle={() => onBookmarkToggle?.()}
            onSignInRequired={() => onSignInRequired?.()}
            disabled={bookmarkBusy}
          />
          <QuoteActions quoteId={quoteId} empty={empty} />
        </div>
      )}
    </div>
  );
};

export default QuoteCard;
