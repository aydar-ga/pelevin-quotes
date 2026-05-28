"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ErrorBanner from "../components/ErrorBanner";
import PelevinIcon from "../components/PelevinIcon";
import QuoteCard from "../components/QuoteCard";
import ThemeToggle from "../components/ThemeToggle";

const PLACEHOLDER = "Нажми на кнопку, чтобы получить цитатку.";

const Home = () => {
  const [quote, setQuote] = useState({
    text: PLACEHOLDER,
    book: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/randomQuote", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          `Сервер вернул статус ${response.status}. Попробуй ещё раз.`,
        );
      }
      const data = await response.json();
      setQuote({ text: data.text, book: data.book });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Не удалось загрузить цитату. Проверь соединение.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <ThemeToggle />
      <Link
        href="/sign-in"
        className="fixed top-4 left-4 rounded-md border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:opacity-80"
      >
        Войти
      </Link>
      <div className="mb-6 flex items-center gap-4 text-[var(--foreground)]">
        <PelevinIcon size={56} />
        <h1 className="text-4xl font-bold md:text-5xl">
          Цитатки из Пелевина
        </h1>
      </div>
      <QuoteCard
        quote={quote.text}
        book={quote.book}
        empty={quote.text === PLACEHOLDER}
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
    </div>
  );
};

export default Home;
