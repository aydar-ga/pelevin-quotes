import Link from "next/link";
import PelevinIcon from "@/components/PelevinIcon";
import ThemeToggle from "@/components/ThemeToggle";
import TopQuoteList from "@/components/TopQuoteList";
import { getServerSession } from "@/lib/auth-server";
import { listTopQuotes, type TopRange } from "@/lib/votes";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ range?: string }>;
};

function normalizeRange(range?: string): TopRange {
  return range === "all" ? "all" : "week";
}

export default async function TopPage({ searchParams }: PageProps) {
  const { range: requestedRange } = await searchParams;
  const range = normalizeRange(requestedRange);
  const session = await getServerSession();
  const items = await listTopQuotes(range, session?.user.id);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <ThemeToggle />
      <div className="flex w-full max-w-2xl items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm hover:opacity-80"
        >
          На главную
        </Link>
        <PelevinIcon size={48} />
      </div>
      <main className="w-full max-w-2xl pt-10">
        <h1 className="text-4xl font-bold">Топ цитат</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Тут цитаты не лежат, а карабкаются. Плюсуй точное, минусуй пустое.
        </p>
        <nav
          aria-label="Период рейтинга"
          className="mt-6 inline-flex rounded-full border border-[var(--card-border)] p-1"
        >
          <Link
            href="/top?range=week"
            aria-current={range === "week" ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              range === "week"
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            За неделю
          </Link>
          <Link
            href="/top?range=all"
            aria-current={range === "all" ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              range === "all"
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            За всё время
          </Link>
        </nav>
        <TopQuoteList items={items} />
      </main>
    </div>
  );
}
