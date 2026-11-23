"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { iconActionClass } from "@/lib/icon-button";
import type { UserVote, VoteSummary, VoteValue } from "@/lib/votes";

interface VoteButtonsProps {
  quoteId: number;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: UserVote;
  onSignInRequired?: () => void;
}

function scoreLabel(score: number) {
  return score > 0 ? `+${score}` : String(score);
}

function sameSummary(a: VoteSummary, b: VoteSummary) {
  return (
    a.quoteId === b.quoteId &&
    a.score === b.score &&
    a.upvotes === b.upvotes &&
    a.downvotes === b.downvotes &&
    a.userVote === b.userVote
  );
}

export default function VoteButtons({
  quoteId,
  score,
  upvotes,
  downvotes,
  userVote,
  onSignInRequired,
}: VoteButtonsProps) {
  const { data: session, isPending } = useSession();
  const fromProps: VoteSummary = {
    quoteId,
    score,
    upvotes,
    downvotes,
    userVote,
  };
  const [summary, setSummary] = useState<VoteSummary>(fromProps);
  const [syncedProps, setSyncedProps] = useState<VoteSummary>(fromProps);
  const [busyVote, setBusyVote] = useState<VoteValue | null>(null);

  // The home page reuses this component across quotes, so local state must
  // follow the parent when it passes a different quote or fresh numbers.
  if (!sameSummary(syncedProps, fromProps)) {
    setSyncedProps(fromProps);
    setSummary(fromProps);
  }

  const submitVote = async (value: VoteValue) => {
    if (!session?.user) {
      onSignInRequired?.();
      return;
    }

    setBusyVote(value);
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, value }),
      });
      if (response.status === 401) {
        onSignInRequired?.();
        return;
      }
      if (!response.ok) return;
      const next = (await response.json()) as VoteSummary;
      setSummary((current) =>
        current.quoteId === next.quoteId ? next : current,
      );
    } catch {
      // Network failure: keep the last known numbers and let the user retry.
    } finally {
      setBusyVote(null);
    }
  };

  return (
    <div className="inline-flex items-center gap-1" aria-label="Рейтинг">
      <button
        type="button"
        aria-label="В плюс"
        aria-pressed={summary.userVote === 1}
        disabled={isPending || busyVote !== null}
        onClick={() => void submitVote(1)}
        className={`${iconActionClass} ${
          summary.userVote === 1
            ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            : ""
        }`}
        title={`${summary.upvotes} за`}
      >
        <ThumbsUp className="h-4 w-4" aria-hidden />
      </button>
      <span
        data-testid="vote-score"
        className="min-w-8 px-1 text-center text-sm font-semibold tabular-nums text-[var(--foreground)]"
        aria-live="polite"
      >
        {scoreLabel(summary.score)}
      </span>
      <button
        type="button"
        aria-label="В минус"
        aria-pressed={summary.userVote === -1}
        disabled={isPending || busyVote !== null}
        onClick={() => void submitVote(-1)}
        className={`${iconActionClass} ${
          summary.userVote === -1
            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
            : ""
        }`}
        title={`${summary.downvotes} против`}
      >
        <ThumbsDown className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
