import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes } from "@/lib/schema";

export const revalidate = 3600;

export async function GET() {
  try {
    const rows = await db.select().from(quotes);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 },
    );
  }
}
