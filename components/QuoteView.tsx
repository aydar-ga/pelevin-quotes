"use client";

import { useState } from "react";
import QuoteCard from "./QuoteCard";
import SignInPanel from "./SignInPanel";

interface QuoteViewProps {
  id: number;
  text: string;
  book: string;
  initialBookmarked: boolean;
}

export default function QuoteView({
  id,
  text,
  book,
  initialBookmarked,
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
      const data = (await response.json()) as { bookmarked: boolean };
      setBookmarked(data.bookmarked);
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
