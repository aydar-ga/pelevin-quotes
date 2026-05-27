import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
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

  const sql = neon(url);
  const db = drizzle(sql);

  const file = resolve(process.cwd(), "scripts/quotes.json");
  const rows: Row[] = JSON.parse(readFileSync(file, "utf8"));

  console.log(`Seeding ${rows.length} quotes...`);

  await sql`DROP TABLE IF EXISTS quotes`;
  await sql`
    CREATE TABLE quotes (
      id serial PRIMARY KEY,
      text text NOT NULL,
      book varchar(255) NOT NULL,
      author varchar(128) NOT NULL DEFAULT 'Виктор Пелевин',
      language varchar(32) NOT NULL DEFAULT 'Russian',
      category varchar(64),
      length integer
    )
  `;

  const values = rows.map((r) => ({
    text: r.quote,
    book: r.book_title,
    author: r.author,
    language: r.language,
    category: r.category,
    length: r.quote.length,
  }));

  await db.insert(quotes).values(values);

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM quotes`;
  console.log(`Seed complete. Rows in table: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
