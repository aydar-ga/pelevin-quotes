"use client";

import ShareQuoteButton from "./ShareQuoteButton";
import VoteButtons from "./VoteButtons";
import type { UserVote } from "@/lib/votes";

interface QuoteActionsProps {
  quoteId: number | null;
  quote: string;
  book: string;
  score?: number;
  upvotes?: number;
  downvotes?: number;
  userVote?: UserVote;
  empty?: boolean;
  onSignInRequired?: () => void;
}

export default function QuoteActions({
  quoteId,
  quote,
  book,
  score = 0,
  upvotes = 0,
  downvotes = 0,
  userVote = 0,
  empty = false,
  onSignInRequired,
}: QuoteActionsProps) {
  if (empty || quoteId == null) return null;

  return (
    <>
      <VoteButtons
        quoteId={quoteId}
        score={score}
        upvotes={upvotes}
        downvotes={downvotes}
        userVote={userVote}
        onSignInRequired={onSignInRequired}
      />
      <ShareQuoteButton quoteId={quoteId} quote={quote} book={book} />
    </>
  );
}
