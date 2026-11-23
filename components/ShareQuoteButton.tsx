"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { iconActionClass } from "@/lib/icon-button";

interface ShareQuoteButtonProps {
  quoteId: number;
  quote: string;
  book: string;
}

function quoteUrl(quoteId: number) {
  if (typeof window === "undefined") return `/q/${quoteId}`;
  return new URL(`/q/${quoteId}`, window.location.origin).toString();
}

function shareText(quote: string, book: string) {
  const source = book.trim();
  return source ? `"${quote}"\n- ${source}` : `"${quote}"`;
}

export default function ShareQuoteButton({
  quoteId,
  quote,
  book,
}: ShareQuoteButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const shareQuote = async () => {
    const url = quoteUrl(quoteId);
    const text = shareText(quote, book);
    const payload = {
      title: "Цитатка из Пелевина",
      text,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        setCopied(true);
        return;
      } catch {}
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      aria-label={copied ? "Ссылка скопирована" : "Поделиться цитатой"}
      onClick={() => void shareQuote()}
      className={iconActionClass}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
