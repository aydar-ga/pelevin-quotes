import { NextResponse } from "next/server";
import { checkUserWriteCap } from "@/lib/abuse-guard";
import { getServerSession } from "@/lib/auth-server";
import { checkVoteRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { isQuoteId, readJsonObject } from "@/lib/request-body";
import { isVoteValue, setQuoteVote } from "@/lib/votes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await checkUserWriteCap(session.user.id))) {
    return NextResponse.json(
      { error: "На сегодня хватит. Возвращайся завтра." },
      { status: 429 },
    );
  }

  const rateLimit = await checkVoteRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много голосов подряд. Выдохни минутку." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const body = await readJsonObject(request);
  const quoteId = body?.quoteId;
  const value = body?.value;

  if (!isQuoteId(quoteId) || !isVoteValue(value)) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const summary = await setQuoteVote(session.user.id, quoteId, value);
  if (!summary) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  return NextResponse.json(summary);
}
