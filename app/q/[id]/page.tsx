import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PelevinIcon from "@/components/PelevinIcon";
import QuoteView from "@/components/QuoteView";
import ThemeToggle from "@/components/ThemeToggle";
import { getServerSession } from "@/lib/auth-server";
import { isBookmarked } from "@/lib/bookmarks";
import { getQuoteById } from "@/lib/quotes";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const quoteId = Number(id);
  if (!Number.isInteger(quoteId)) return { title: "Цитатка не найдена" };

  const quote = await getQuoteById(quoteId);
  if (!quote) return { title: "Цитатка не найдена" };

  const excerpt =
    quote.text.length > 120 ? `${quote.text.slice(0, 117)}…` : quote.text;

  return {
    title: `${excerpt} — Цитатки из Пелевина`,
    description: quote.book,
    openGraph: {
      title: `"${excerpt}"`,
      description: quote.book,
      type: "article",
      locale: "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title: `"${excerpt}"`,
      description: quote.book,
    },
  };
}

export default async function QuotePermalinkPage({ params }: PageProps) {
  const { id } = await params;
  const quoteId = Number(id);

  if (!Number.isInteger(quoteId) || quoteId < 1) notFound();

  const quote = await getQuoteById(quoteId);
  if (!quote) notFound();

  const session = await getServerSession();
  const bookmarked = session?.user
    ? await isBookmarked(session.user.id, quoteId)
    : false;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <ThemeToggle />
      <div className="mb-6 flex items-center gap-4 text-[var(--foreground)]">
        <PelevinIcon size={56} />
        <h1 className="text-3xl font-bold md:text-4xl">Цитатка #{quoteId}</h1>
      </div>
      <QuoteView
        id={quote.id}
        text={quote.text}
        book={quote.book}
        initialBookmarked={bookmarked}
      />
      <Link
        href="/"
        className="mt-8 rounded-full border border-[var(--card-border)] px-5 py-2 text-sm hover:opacity-80"
      >
        ← На главную
      </Link>
    </div>
  );
}
