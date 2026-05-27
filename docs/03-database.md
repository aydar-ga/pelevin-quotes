# Database

## Provider

[Neon Postgres](https://neon.tech), provisioned through the Vercel Marketplace.
The Vercel integration auto-injects `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
and the legacy `POSTGRES_*` variables into every deployment environment.

The app only uses `DATABASE_URL` (pooled connection over HTTP via
`@neondatabase/serverless`).

## Schema (`lib/schema.ts`)

Single table, declared with Drizzle:

```ts
export const quotes = pgTable("quotes", {
  id:       serial("id").primaryKey(),
  text:     text("text").notNull(),
  book:     varchar("book", { length: 255 }).notNull(),
  author:   varchar("author", { length: 128 }).default("Виктор Пелевин").notNull(),
  language: varchar("language", { length: 32 }).default("Russian").notNull(),
  category: varchar("category", { length: 64 }),
  length:   integer("length"),
});
```

## Local workflow

```bash
vercel env pull .env.local   # get DATABASE_URL
npm run db:push              # apply schema changes via drizzle-kit
npm run db:seed              # wipe + reseed quotes from scripts/quotes.json
```

`scripts/seed.ts` is **destructive** — it drops the `quotes` table and rebuilds
it. Run it only locally against a dev branch, or against a Neon preview branch.

## Seed source

`scripts/quotes.json` is committed (~300 rows). It is generated from
`/Users/aydar/DevTools/Repos-Dev/Pelevin_quotes__RU____sample_dataset.numbers`
using `numbers-parser`. To regenerate:

```bash
python3 -m venv /tmp/venv && source /tmp/venv/bin/activate
pip install numbers-parser
python /tmp/build_seed.py   # see docs/snippets/build_seed.py
```

The `.numbers` file is not in the repo (proprietary Apple format). The JSON
export is the canonical source for CI and contributors.
