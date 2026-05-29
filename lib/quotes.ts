import { eq } from "drizzle-orm";
import { db } from "./db";
import { quotes } from "./schema";

export async function getQuoteById(id: number) {
  const rows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, id))
    .limit(1);
  return rows[0] ?? null;
}
