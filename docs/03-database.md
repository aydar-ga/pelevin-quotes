# Database

## Provider

[Neon Postgres](https://neon.tech), provisioned through the Vercel Marketplace.
The Vercel integration auto-injects `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
and the legacy `POSTGRES_*` variables into every deployment environment.

The app only uses `DATABASE_URL` (pooled connection over HTTP via
`@neondatabase/serverless`).

## Schema (`lib/schema.ts`)

For ERD, class/module diagrams, and request-to-schema mapping, see
[`docs/10-data-model.md`](./10-data-model.md). The quote voting roadmap item
adds `quote_votes`; auth, bookmark, share, and cross-tab sync use the existing
tables.

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

### `quote_votes`

```ts
export const quoteVotes = pgTable("quote_votes", {
  id:        serial("id").primaryKey(),
  userId:    text("user_id").references(() => user.id, { onDelete: "cascade" }),
  quoteId:   integer("quote_id").references(() => quotes.id, { onDelete: "cascade" }),
  value:     integer("value").notNull(), // checked: -1 or 1
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("quote_votes_user_quote_idx").on(t.userId, t.quoteId),
  index("quote_votes_quote_updated_idx").on(t.quoteId, t.updatedAt),
  check("quote_votes_value_check", sql`${t.value} in (-1, 1)`),
]);
```

## Recent Product Requests

| Request | DB decision |
| ------- | ----------- |
| Signup name field | Already covered by `user.name text not null`; registration sends the name, login does not. |
| Prevent login from creating unnamed users | Enforced in `lib/auth-intent.ts` before Better Auth sends the magic link. |
| Flat bookmarks list | Keep one `bookmarks` join table; book grouping is not a persisted concept. |
| Header bookmark count updates | Count from `bookmarks`; do not add a denormalized counter column. |
| Improved sharing | `/q/[id]` uses stable `quotes.id`; no share table needed. |
| Cross-tab auth/bookmark sync | Browser event/localStorage bridge; no persisted state needed. |
| Public ranking | `quote_votes` stores one up/down vote per user and quote; leaderboard scores are aggregated at read time. |
| AI quote generation | Not on `main`; future generated quotes need a separate table. |

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
| `0001_add_quote_votes.sql` | `quote_votes` table, indexes, FKs, value check |

Both files are idempotent (`IF NOT EXISTS` and `DO $$ … duplicate_object`
blocks). After `db:generate`, rewrite new DDL in the same style before
committing. Rollback for `0001` is `DROP TABLE quote_votes;` (it only holds
votes). Then delete the journal entry if the migration should be re-run.

## Local workflow

```bash
vercel env pull .env.local   # get DATABASE_URL
npm run db:migrate           # apply migrations
npm run db:seed              # wipe + reseed quotes from scripts/quotes.json
```

`scripts/seed.ts` is **destructive** — it clears the `quotes` table and reloads
it. Run it only locally against a dev branch, or against a Neon preview branch.
It does not touch auth, bookmark, or vote tables.

## Seed source

`scripts/quotes.json` is committed (~300 rows). It is generated from
`/Users/aydar/DevTools/Repos-Dev/Pelevin_quotes__RU____sample_dataset.numbers`
using `numbers-parser`. The extraction helper is not committed; if the source
dataset changes, regenerate the JSON locally and review the diff before seeding.
Example setup:

```bash
python3 -m venv /tmp/venv && source /tmp/venv/bin/activate
pip install numbers-parser
# Run a local conversion script that writes scripts/quotes.json.
```

The `.numbers` file is not in the repo (proprietary Apple format). The JSON
export is the canonical source for CI and contributors.
