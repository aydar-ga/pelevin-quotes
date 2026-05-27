# Architecture

A deliberately small Next.js app. One page, two API routes, one table.

```
┌────────────────────┐       fetch        ┌────────────────────────┐
│  app/page.tsx      │ ─────────────────▶ │  app/api/randomQuote   │
│  (React 19, RSC)   │                    │  app/api/allQuotes     │
└────────────────────┘                    └──────────┬─────────────┘
                                                     │ drizzle-orm
                                                     ▼
                                          ┌──────────────────────┐
                                          │   Neon Postgres      │
                                          │   table: quotes      │
                                          └──────────────────────┘
```

## Modules

| Path                            | Role                                                  |
| ------------------------------- | ----------------------------------------------------- |
| `app/layout.tsx`                | HTML shell, theme bootstrap script, fonts             |
| `app/page.tsx`                  | Client component: button + state + error handling     |
| `app/api/randomQuote/route.ts`  | `GET` — `ORDER BY random() LIMIT 1`                   |
| `app/api/allQuotes/route.ts`    | `GET` — full list (ISR, revalidate 1h)                |
| `components/QuoteCard.tsx`      | Presentational card                                   |
| `components/ErrorBanner.tsx`    | Inline error with optional retry                      |
| `components/ThemeToggle.tsx`    | Theme toggle via `useSyncExternalStore`               |
| `lib/db.ts`                     | Drizzle client over `@neondatabase/serverless`        |
| `lib/schema.ts`                 | Drizzle table definitions + inferred types            |
| `scripts/seed.ts`               | Idempotent seeder reading `scripts/quotes.json`       |
| `drizzle.config.ts`             | Drizzle Kit config (push / migrations)                |

## Data model

```ts
quotes(
  id        serial primary key,
  text      text not null,
  book      varchar(255) not null,
  author    varchar(128) default 'Виктор Пелевин',
  language  varchar(32)  default 'Russian',
  category  varchar(64),
  length    integer
)
```

300 rows seeded from `Pelevin_quotes__RU____sample_dataset.numbers`
(exported into `scripts/quotes.json` so the seed is reproducible without the
proprietary `.numbers` file).

## Rendering

- The home page is a client component (button needs state). The HTML shell is
  server-rendered.
- `randomQuote` is force-dynamic (each call must hit the DB).
- `allQuotes` is statically generated with 1h ISR — the dataset rarely changes.

## Theming

A blocking inline script in `<head>` reads `localStorage.theme` (or
`prefers-color-scheme`) and sets `<html data-theme="...">` **before paint**, so
there is no flash of wrong theme. The `ThemeToggle` component then subscribes
to the `storage` event via `useSyncExternalStore` — no `useEffect → setState`,
which React 19 disallows.
