import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { createDb } from "../lib/db-client";
import { quotes } from "../lib/schema";

type Row = {
  id: number;
  quote: string;
  book_title: string;
  author: string;
  language: string;
  category: string;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const db = createDb(url);

  const file = resolve(process.cwd(), "scripts/quotes.json");
  const rows: Row[] = JSON.parse(readFileSync(file, "utf8"));

  console.log(`Seeding ${rows.length} quotes...`);

  await db.execute(sql`DROP TABLE IF EXISTS quotes`);
  await db.execute(sql`
    CREATE TABLE quotes (
      id serial PRIMARY KEY,
      text text NOT NULL,
      book varchar(255) NOT NULL,
      author varchar(128) NOT NULL DEFAULT 'Виктор Пелевин',
      language varchar(32) NOT NULL DEFAULT 'Russian',
      category varchar(64),
      length integer
    )
  `);

  const values = rows.map((r) => ({
    text: r.quote,
    book: r.book_title,
    author: r.author,
    language: r.language,
    category: r.category,
    length: r.quote.length,
  }));

  await db.insert(quotes).values(values);

  const result = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM quotes`,
  );
  const count = Number(result.rows[0]?.count ?? 0);
  console.log(`Seed complete. Rows in table: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
