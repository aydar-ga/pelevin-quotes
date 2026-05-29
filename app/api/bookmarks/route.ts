import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { countBookmarks, listBookmarks, toggleBookmark } from "@/lib/bookmarks";

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

  const body = (await request.json()) as { quoteId?: number };
  const quoteId = body.quoteId;

  if (typeof quoteId !== "number" || !Number.isInteger(quoteId) || quoteId < 1) {
    return NextResponse.json({ error: "Invalid quoteId" }, { status: 400 });
  }

  const bookmarked = await toggleBookmark(session.user.id, quoteId);
  const total = await countBookmarks(session.user.id);

  return NextResponse.json({ bookmarked, total, quoteId });
}
