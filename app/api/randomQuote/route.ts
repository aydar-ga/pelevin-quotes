import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  checkRandomQuoteRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { quotes } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimit = await checkRandomQuoteRateLimit(request.headers);
  const headers = rateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов. Дай серверу выдохнуть." },
      { status: 429, headers },
    );
  }

  try {
    const rows = await db
      .select()
      .from(quotes)
      .orderBy(sql`random()`)
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No quotes available" },
        { status: 404 },
      );
    }

    const q = rows[0];
    return NextResponse.json(
      { id: q.id, text: q.text, book: q.book, author: q.author },
      { headers: { ...headers, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error fetching random quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 },
    );
  }
}
