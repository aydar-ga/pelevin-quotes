import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { isBookmarked } from "@/lib/bookmarks";
import { getQuoteById } from "@/lib/quotes";
import { getQuoteVoteSummary } from "@/lib/votes";
import { quoteIdParamSchema } from "@/lib/request-body";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = quoteIdParamSchema.safeParse((await context.params).id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const quoteId = parsed.data;

  const quote = await getQuoteById(quoteId);
  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession();
  const bookmarked = session?.user
    ? await isBookmarked(session.user.id, quoteId)
    : false;
  const vote = await getQuoteVoteSummary(quoteId, session?.user.id);

  return NextResponse.json({
    id: quote.id,
    text: quote.text,
    book: quote.book,
    author: quote.author,
    bookmarked,
    vote,
  });
}
