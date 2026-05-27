"use client";

import React from "react";
import PelevinIcon from "./PelevinIcon";

interface QuoteCardProps {
  quote: string;
  book: string;
  empty?: boolean;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, book, empty }) => {
  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 shadow-md">
      {empty && (
        <div className="mb-6 flex justify-center text-[var(--muted)]">
          <PelevinIcon size={96} />
        </div>
      )}
      <p className="mb-6 text-center text-lg text-[var(--foreground)]">
        &quot;{quote}&quot;
      </p>
      {book && (
        <p className="text-right text-sm text-[var(--muted)]">- {book}</p>
      )}
    </div>
  );
};

export default QuoteCard;
