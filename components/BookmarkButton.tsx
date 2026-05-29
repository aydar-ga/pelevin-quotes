"use client";

import { Heart } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { iconActionClass } from "@/lib/icon-button";

interface BookmarkButtonProps {
  quoteId: number | null;
  bookmarked: boolean;
  onToggle: () => void;
  onSignInRequired: () => void;
  disabled?: boolean;
}

export default function BookmarkButton({
  quoteId,
  bookmarked,
  onToggle,
  onSignInRequired,
  disabled = false,
}: BookmarkButtonProps) {
  const { data: session, isPending } = useSession();

  if (quoteId == null) return null;

  const handleClick = () => {
    if (!session?.user) {
      onSignInRequired();
      return;
    }
    onToggle();
  };

  return (
    <button
      type="button"
      data-testid="bookmark-button"
      aria-label={bookmarked ? "Убрать из закладок" : "Добавить в закладки"}
      aria-pressed={bookmarked}
      disabled={disabled || isPending}
      onClick={handleClick}
      className={`${iconActionClass} ${
        bookmarked
          ? "border-red-400/50 bg-red-500/10 text-red-400"
          : ""
      }`}
    >
      <Heart
        className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`}
        aria-hidden
      />
    </button>
  );
}
