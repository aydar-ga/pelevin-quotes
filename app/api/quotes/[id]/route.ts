import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { isBookmarked } from "@/lib/bookmarks";
import { getQuoteById } from "@/lib/quotes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const quoteId = Number(id);

  if (!Number.isInteger(quoteId) || quoteId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const quote = await getQuoteById(quoteId);
  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession();
  const bookmarked = session?.user
    ? await isBookmarked(session.user.id, quoteId)
    : false;

  return NextResponse.json({
    id: quote.id,
    text: quote.text,
    book: quote.book,
    author: quote.author,
    bookmarked,
  });
}
