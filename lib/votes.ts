import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { quoteVotes, quotes } from "./schema";

export type VoteValue = -1 | 1;
export type UserVote = VoteValue | 0;
export type TopRange = "week" | "all";

export interface VoteSummary {
  quoteId: number;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: UserVote;
}

export interface TopQuote extends VoteSummary {
  id: number;
  text: string;
  book: string;
  author: string;
}

export function isVoteValue(value: unknown): value is VoteValue {
  return value === 1 || value === -1;
}

// A subquery, not the joined rows: on the weekly board the join only sees
// recent votes, and an older vote by this user must still show as pressed.
function userVoteProjection(userId?: string) {
  return userId
    ? sql<UserVote>`coalesce((select own_vote.value from ${quoteVotes} as own_vote where own_vote.quote_id = ${quotes.id} and own_vote.user_id = ${userId}), 0)::int`
    : sql<UserVote>`0::int`;
}

function scoreProjection() {
  return sql<number>`coalesce(sum(${quoteVotes.value}), 0)::int`;
}

function upvotesProjection() {
  return sql<number>`count(${quoteVotes.id}) filter (where ${quoteVotes.value} = 1)::int`;
}

function downvotesProjection() {
  return sql<number>`count(${quoteVotes.id}) filter (where ${quoteVotes.value} = -1)::int`;
}

export async function getQuoteVoteSummary(
  quoteId: number,
  userId?: string,
): Promise<VoteSummary> {
  const rows = await db
    .select({
      quoteId: quotes.id,
      score: scoreProjection(),
      upvotes: upvotesProjection(),
      downvotes: downvotesProjection(),
      userVote: userVoteProjection(userId),
    })
    .from(quotes)
    .leftJoin(quoteVotes, eq(quoteVotes.quoteId, quotes.id))
    .where(eq(quotes.id, quoteId))
    .groupBy(quotes.id)
    .limit(1);

  return (
    rows[0] ?? {
      quoteId,
      score: 0,
      upvotes: 0,
      downvotes: 0,
      userVote: 0,
    }
  );
}

// Returns null when the quote does not exist. Each statement is atomic on its
// own, so a double click or two tabs cannot hit the unique index and 500.
export async function setQuoteVote(
  userId: string,
  quoteId: number,
  value: VoteValue,
): Promise<VoteSummary | null> {
  const quote = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);
  if (quote.length === 0) return null;

  const removed = await db
    .delete(quoteVotes)
    .where(
      and(
        eq(quoteVotes.userId, userId),
        eq(quoteVotes.quoteId, quoteId),
        eq(quoteVotes.value, value),
      ),
    )
    .returning();

  if (removed.length === 0) {
    await db
      .insert(quoteVotes)
      .values({ userId, quoteId, value })
      .onConflictDoUpdate({
        target: [quoteVotes.userId, quoteVotes.quoteId],
        set: { value, updatedAt: sql`now()` },
      });
  }

  return getQuoteVoteSummary(quoteId, userId);
}

export async function listTopQuotes(
  range: TopRange,
  userId?: string,
  limit = 20,
): Promise<TopQuote[]> {
  const joinCondition =
    range === "week"
      ? and(
          eq(quoteVotes.quoteId, quotes.id),
          gte(quoteVotes.updatedAt, sql`now() - interval '7 days'`),
        )
      : eq(quoteVotes.quoteId, quotes.id);

  return db
    .select({
      id: quotes.id,
      quoteId: quotes.id,
      text: quotes.text,
      book: quotes.book,
      author: quotes.author,
      score: scoreProjection(),
      upvotes: upvotesProjection(),
      downvotes: downvotesProjection(),
      userVote: userVoteProjection(userId),
    })
    .from(quotes)
    .innerJoin(quoteVotes, joinCondition)
    .groupBy(quotes.id)
    .orderBy(desc(scoreProjection()), desc(upvotesProjection()), asc(quotes.id))
    .limit(limit);
}
