"use client";

import Link from "next/link";
import { useState } from "react";
import SignInPanel from "./SignInPanel";
import ShareQuoteButton from "./ShareQuoteButton";
import VoteButtons from "./VoteButtons";
import type { TopQuote } from "@/lib/votes";

interface TopQuoteListProps {
  items: TopQuote[];
}

export default function TopQuoteList({ items }: TopQuoteListProps) {
  const [signInOpen, setSignInOpen] = useState(false);

  if (items.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-[var(--muted)]">
        Пока тихо. Первый плюс решает, кто тут наверху.
      </p>
    );
  }

  return (
    <>
      <ol className="mt-8 w-full max-w-2xl space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 w-8 shrink-0 font-mono text-sm text-[var(--muted)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/q/${item.id}`} className="block hover:opacity-80">
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">
                    &ldquo;{item.text}&rdquo;
                  </p>
                  <p className="mt-2 truncate text-xs text-[var(--muted)]">
                    {item.book}
                  </p>
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <VoteButtons
                    quoteId={item.id}
                    score={item.score}
                    upvotes={item.upvotes}
                    downvotes={item.downvotes}
                    userVote={item.userVote}
                    onSignInRequired={() => setSignInOpen(true)}
                  />
                  <ShareQuoteButton
                    quoteId={item.id}
                    quote={item.text}
                    book={item.book}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <SignInPanel
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        hint="Войди, чтобы двигать цитаты вверх и вниз."
      />
    </>
  );
}
