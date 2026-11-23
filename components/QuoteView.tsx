"use client";

import { useState } from "react";
import QuoteCard from "./QuoteCard";
import SignInPanel from "./SignInPanel";
import { publishBookmarkChange } from "@/lib/app-events";
import type { VoteSummary } from "@/lib/votes";

interface QuoteViewProps {
  id: number;
  text: string;
  book: string;
  initialBookmarked: boolean;
  initialVote?: VoteSummary;
}

export default function QuoteView({
  id,
  text,
  book,
  initialBookmarked,
  initialVote,
}: QuoteViewProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  const toggleBookmark = async () => {
    setBookmarkBusy(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: id }),
      });
      if (response.status === 401) {
        setSignInOpen(true);
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as {
        bookmarked: boolean;
        total: number;
        quoteId: number;
      };
      setBookmarked(data.bookmarked);
      publishBookmarkChange({
        total: data.total,
        quoteId: data.quoteId,
        bookmarked: data.bookmarked,
      });
    } finally {
      setBookmarkBusy(false);
    }
  };

  return (
    <>
      <QuoteCard
        quote={text}
        book={book}
        quoteId={id}
        bookmarked={bookmarked}
        score={initialVote?.score ?? 0}
        upvotes={initialVote?.upvotes ?? 0}
        downvotes={initialVote?.downvotes ?? 0}
        userVote={initialVote?.userVote ?? 0}
        onBookmarkToggle={toggleBookmark}
        onSignInRequired={() => setSignInOpen(true)}
        bookmarkBusy={bookmarkBusy}
      />
      <SignInPanel
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        hint="Войди, чтобы сохранять цитаты в закладки."
      />
    </>
  );
}
