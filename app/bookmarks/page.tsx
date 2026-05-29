"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthStatus from "@/components/AuthStatus";
import PelevinIcon from "@/components/PelevinIcon";
import QuoteCard from "@/components/QuoteCard";
import ThemeToggle from "@/components/ThemeToggle";
import { useSession } from "@/lib/auth-client";

type BookmarkItem = {
  id: number;
  text: string;
  book: string;
  author: string;
};

export default function BookmarksPage() {
  const { data: session, isPending } = useSession();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/?signIn=1");
      return;
    }

    let cancelled = false;
    fetch("/api/bookmarks", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        return response.json() as Promise<{ items: BookmarkItem[] }>;
      })
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить закладки.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isPending, session?.user, router]);

  const removeBookmark = async (quoteId: number) => {
    const response = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId }),
    });
    if (!response.ok) return;
    setItems((current) => current.filter((item) => item.id !== quoteId));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 pb-16">
      <ThemeToggle />
      <AuthStatus />
      <div className="mx-auto flex max-w-2xl flex-col items-center pt-16">
        <div className="mb-8 flex items-center gap-4 text-[var(--foreground)]">
          <PelevinIcon size={48} />
          <h1 className="text-3xl font-bold md:text-4xl">Закладки</h1>
        </div>

        {loading && (
          <p className="text-[var(--muted)]">Загружаем закладки…</p>
        )}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="text-center">
            <p className="text-[var(--muted)]">Пока пусто.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-foreground)]"
            >
              Найти цитатку
            </Link>
          </div>
        )}
        <div className="flex w-full flex-col gap-6">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col items-center gap-2">
              <QuoteCard
                quote={item.text}
                book={item.book}
                quoteId={item.id}
                bookmarked
                onBookmarkToggle={() => removeBookmark(item.id)}
              />
              <Link
                href={`/q/${item.id}`}
                className="text-sm text-[var(--muted)] hover:underline"
              >
                Открыть ссылку
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
