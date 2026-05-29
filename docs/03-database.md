# Database

## Provider

[Neon Postgres](https://neon.tech), provisioned through the Vercel Marketplace.
The Vercel integration auto-injects `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
and the legacy `POSTGRES_*` variables into every deployment environment.

The app only uses `DATABASE_URL` (pooled connection over HTTP via
`@neondatabase/serverless`).

## Schema (`lib/schema.ts`)

### `quotes`

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

### Better Auth tables

`user`, `session`, `account`, `verification` — declared in `lib/schema.ts`,
managed by Better Auth via the Drizzle adapter.

### `bookmarks`

```ts
export const bookmarks = pgTable("bookmarks", {
  id:        serial("id").primaryKey(),
  userId:    text("user_id").references(() => user.id, { onDelete: "cascade" }),
  quoteId:   integer("quote_id").references(() => quotes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("bookmarks_user_quote_idx").on(t.userId, t.quoteId)]);
```

## Migrations (preferred for production)

Schema changes are versioned under `drizzle/` and applied with Drizzle Kit:

```bash
# 1. Edit lib/schema.ts
npm run db:generate    # creates a new SQL file in drizzle/
npm run db:migrate     # applies pending migrations to Neon
```

`db:push` remains available for rapid local prototyping. **Vercel deploys**
run `npm run db:migrate` automatically via `vercel-build` (see
[`docs/05-deployment.md`](./05-deployment.md)).

Current migrations:

| File                      | Change              |
| ------------------------- | ------------------- |
| `0000_add_bookmarks.sql`  | `bookmarks` table   |

## Local workflow

```bash
vercel env pull .env.local   # get DATABASE_URL
npm run db:migrate           # apply migrations
npm run db:seed              # wipe + reseed quotes from scripts/quotes.json
```

`scripts/seed.ts` is **destructive** — it clears the `quotes` table and reloads
it. Run it only locally against a dev branch, or against a Neon preview branch.
It does not touch auth or bookmark tables.

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
