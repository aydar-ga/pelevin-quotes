"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { iconActionClass } from "@/lib/icon-button";

interface QuoteActionsProps {
  quoteId: number | null;
  empty?: boolean;
}

export default function QuoteActions({
  quoteId,
  empty = false,
}: QuoteActionsProps) {
  if (empty || quoteId == null) return null;

  return (
    <Link
      href={`/q/${quoteId}`}
      aria-label="Открыть цитату"
      className={iconActionClass}
    >
      <ExternalLink className="h-4 w-4" aria-hidden />
    </Link>
  );
}
