import { NextResponse } from "next/server";
import { checkUserWriteCap } from "@/lib/abuse-guard";
import { getServerSession } from "@/lib/auth-server";
import { countBookmarks, listBookmarks, toggleBookmark } from "@/lib/bookmarks";
import { bookmarkBodySchema, readJsonObject } from "@/lib/request-body";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, total] = await Promise.all([
    listBookmarks(session.user.id),
    countBookmarks(session.user.id),
  ]);

  return NextResponse.json({ items, total });
}

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

  const parsed = bookmarkBodySchema.safeParse(await readJsonObject(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quoteId" }, { status: 400 });
  }
  const { quoteId } = parsed.data;

  const bookmarked = await toggleBookmark(session.user.id, quoteId);
  const total = await countBookmarks(session.user.id);

  return NextResponse.json({ bookmarked, total, quoteId });
}
