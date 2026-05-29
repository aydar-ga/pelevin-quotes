"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { iconActionClass } from "@/lib/icon-button";

interface QuoteActionsProps {
  quote: string;
  book: string;
  quoteId: number | null;
  empty?: boolean;
}

function formatShareText(quote: string, book: string) {
  return book ? `"${quote}" — ${book}` : `"${quote}"`;
}

export default function QuoteActions({
  quote,
  book,
  quoteId,
  empty = false,
}: QuoteActionsProps) {
  const [copied, setCopied] = useState(false);
  const sharingRef = useRef(false);

  if (empty || !quote.trim()) return null;

  const shareText = formatShareText(quote, book);
  const shareUrl =
    quoteId != null
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/q/${quoteId}`
      : undefined;

  const copyQuote = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const shareQuote = async () => {
    if (sharingRef.current) return;
    if (!navigator.share) {
      await copyQuote();
      return;
    }

    sharingRef.current = true;
    try {
      await navigator.share({
        title: "Цитатка из Пелевина",
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (
        error instanceof DOMException &&
        error.name === "InvalidStateError"
      ) {
        return;
      }
      throw error;
    } finally {
      sharingRef.current = false;
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={copyQuote}
        aria-label={copied ? "Скопировано" : "Копировать цитату"}
        className={iconActionClass}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={shareQuote}
        aria-label="Поделиться цитатой"
        className={iconActionClass}
      >
        <Share2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
