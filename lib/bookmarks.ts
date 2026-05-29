import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { bookmarks, quotes } from "./schema";

export async function toggleBookmark(userId: string, quoteId: number) {
  const existing = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.quoteId, quoteId)),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    return false;
  }

  await db.insert(bookmarks).values({ userId, quoteId });
  return true;
}

export async function listBookmarks(userId: string) {
  return db
    .select({
      id: quotes.id,
      text: quotes.text,
      book: quotes.book,
      author: quotes.author,
      bookmarkedAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .innerJoin(quotes, eq(bookmarks.quoteId, quotes.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

export async function isBookmarked(userId: string, quoteId: number) {
  const rows = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.quoteId, quoteId)),
    )
    .limit(1);
  return rows.length > 0;
}

export async function countBookmarks(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId));
  return rows[0]?.count ?? 0;
}
