"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthStatus from "../components/AuthStatus";
import ErrorBanner from "../components/ErrorBanner";
import PelevinIcon from "../components/PelevinIcon";
import QuoteCard from "../components/QuoteCard";
import ThemeToggle from "../components/ThemeToggle";
import WelcomeBanner from "../components/WelcomeBanner";
import {
  publishAuthChange,
  publishBookmarkChange,
  subscribeAuthChange,
} from "@/lib/app-events";
import type { UserVote } from "@/lib/votes";

const PLACEHOLDER = "Нажми на кнопку, чтобы получить цитатку.";
type QuoteState = {
  id: number | null;
  text: string;
  book: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: UserVote;
};

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteState>({
    id: null,
    text: PLACEHOLDER,
    book: "",
    score: 0,
    upvotes: 0,
    downvotes: 0,
    userVote: 0,
  });
  const [bookmarked, setBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(
    () => searchParams.get("signIn") === "1",
  );
  const [accountOpen, setAccountOpen] = useState(
    () =>
      searchParams.get("panel") === "account" ||
      searchParams.get("bookmarks") === "1",
  );
  const [signInHint, setSignInHint] = useState<string | undefined>(() =>
    searchParams.get("signIn") === "1"
      ? "Войди, чтобы сохранять цитаты в закладки."
      : undefined,
  );
  const [showWelcome, setShowWelcome] = useState(
    () => searchParams.get("welcome") === "1",
  );

  useEffect(() => {
    const welcome = searchParams.get("welcome") === "1";
    const signIn = searchParams.get("signIn") === "1";
    const account =
      searchParams.get("panel") === "account" ||
      searchParams.get("bookmarks") === "1";
    if (welcome) {
      publishAuthChange("signed-in");
      router.refresh();
    }
    if (welcome || signIn || account) {
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    return subscribeAuthChange((change) => {
      if (change.status === "signed-in") {
        setSignInOpen(false);
        setSignInHint(undefined);
        router.refresh();
      }
      if (change.status === "signed-out") {
        setAccountOpen(false);
        setBookmarked(false);
        setShowWelcome(false);
        router.refresh();
      }
    });
  }, [router]);

  const generateQuote = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/randomQuote", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          `Сервер вернул статус ${response.status}. Попробуй ещё раз.`,
        );
      }
      const data = (await response.json()) as {
        id: number;
        text: string;
        book: string;
      };
      setQuote({
        id: data.id,
        text: data.text,
        book: data.book,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        userVote: 0,
      });

      if (data.id) {
        const detail = await fetch(`/api/quotes/${data.id}`, {
          cache: "no-store",
        });
        if (detail.ok) {
          const payload = (await detail.json()) as {
            bookmarked?: boolean;
            vote?: {
              score: number;
              upvotes: number;
              downvotes: number;
              userVote: UserVote;
            };
          };
          setBookmarked(Boolean(payload.bookmarked));
          const vote = payload.vote;
          if (vote) {
            setQuote((current) =>
              current.id === data.id
                ? {
                    ...current,
                    score: vote.score,
                    upvotes: vote.upvotes,
                    downvotes: vote.downvotes,
                    userVote: vote.userVote,
                  }
                : current,
            );
          }
        } else {
          setBookmarked(false);
        }
      } else {
        setBookmarked(false);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Не удалось загрузить цитату. Проверь соединение.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.code !== "Space") return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (signInOpen || accountOpen || isLoading) return;
      event.preventDefault();
      void generateQuote();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [generateQuote, isLoading, signInOpen, accountOpen]);

  const toggleBookmark = async () => {
    if (quote.id == null) return;
    setBookmarkBusy(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id }),
      });
      if (response.status === 401) {
        setSignInHint("Войди, чтобы сохранять цитаты в закладки.");
        setSignInOpen(true);
        return;
      }
      if (!response.ok) throw new Error("bookmark failed");
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
    } catch {
      setError("Не удалось обновить закладку. Попробуй ещё раз.");
    } finally {
      setBookmarkBusy(false);
    }
  };

  const openSignIn = (hint?: string) => {
    setSignInHint(hint);
    setSignInOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <WelcomeBanner
        visible={showWelcome}
        onDismiss={() => setShowWelcome(false)}
      />
      <ThemeToggle />
      <AuthStatus
        signInOpen={signInOpen}
        onSignInOpen={() => openSignIn()}
        onSignInClose={() => {
          setSignInOpen(false);
          setSignInHint(undefined);
        }}
        signInHint={signInHint}
        accountOpen={accountOpen}
        onAccountOpen={() => setAccountOpen(true)}
        onAccountClose={() => setAccountOpen(false)}
      />
      <div className="mb-6 flex items-center gap-4 text-[var(--foreground)]">
        <PelevinIcon size={56} />
        <h1 className="text-4xl font-bold md:text-5xl">
          Цитатки из Пелевина
        </h1>
      </div>
      <QuoteCard
        quote={quote.text}
        book={quote.book}
        quoteId={quote.id}
        empty={quote.text === PLACEHOLDER}
        bookmarked={bookmarked}
        score={quote.score}
        upvotes={quote.upvotes}
        downvotes={quote.downvotes}
        userVote={quote.userVote}
        onBookmarkToggle={toggleBookmark}
        onSignInRequired={() =>
          openSignIn("Войди, чтобы сохранять цитаты в закладки.")
        }
        onVoteSignInRequired={() =>
          openSignIn("Войди, чтобы двигать цитаты вверх и вниз.")
        }
        bookmarkBusy={bookmarkBusy}
      />
      {error && <ErrorBanner message={error} onRetry={generateQuote} />}
      <button
        onClick={generateQuote}
        disabled={isLoading}
        className="mt-6 flex items-center rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] shadow-lg transition-opacity duration-300 hover:opacity-90 disabled:opacity-60"
      >
        <RefreshCw
          className={`mr-2 h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
        />
        Давай цитатку
      </button>
      <Link
        href="/top"
        className="mt-4 rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        Топ цитат
      </Link>
    </div>
  );
}
