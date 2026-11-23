# Architecture

A small Next.js app: random quotes, magic-link auth, bookmarks, voting,
leaderboards, and shareable permalinks.

```
┌────────────────────┐       fetch        ┌──────────────────────────────┐
│  app/page.tsx      │ ─────────────────▶ │  /api/randomQuote            │
│  HomeClient        │                    │  /api/quotes/[id]            │
│  (React 19)        │                    │  /api/bookmarks              │
│                    │                    │  /api/votes                  │
└─────────┬──────────┘                    │  /api/auth/[...all]          │
          │                               └──────────────┬───────────────┘
          │ SignInPanel / AccountPanel / TopQuoteList            │ drizzle-orm
          ▼                                              ▼
┌────────────────────┐                    ┌──────────────────────────────┐
│  /q/[id], /top     │                    │   Neon Postgres              │
└────────────────────┘                    │   account, verification,     │
                                          │   bookmarks, quote_votes     │
                                          └──────────────────────────────┘
```

## Modules

| Path                               | Role                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| `app/layout.tsx`                   | HTML shell, theme bootstrap, Vercel Analytics + Speed Insights |
| `app/page.tsx`                     | Suspense wrapper around `HomeClient`                       |
| `app/HomeClient.tsx`               | Quote button, keyboard shortcut, sign-in panel orchestration |
| `app/q/[id]/page.tsx`              | Shareable quote permalink                                  |
| `app/q/[id]/opengraph-image.tsx`   | Dynamic OG image per quote (`next/og`)                     |
| `app/top/page.tsx`                  | Public weekly/all-time leaderboard                         |
| `app/bookmarks/page.tsx`           | Redirect → home with account panel open                    |
| `app/sign-in/page.tsx`             | Redirects to `/?signIn=1` (panel on home)                  |
| `app/api/randomQuote/route.ts`     | `GET` — rate-limited `ORDER BY random() LIMIT 1`           |
| `app/api/allQuotes/route.ts`       | `GET` — full list, force-dynamic to avoid build-time DB access |
| `app/api/bookmarks/route.ts`       | `GET` / `POST` — list and toggle bookmarks                 |
| `app/api/votes/route.ts`           | `POST` — up/down-vote a quote                              |
| `app/api/quotes/[id]/route.ts`     | `GET` — quote detail + bookmark state                      |
| `app/api/auth/[...all]/route.ts`   | Better Auth catch-all                                      |
| `components/QuoteCard.tsx`         | Quote display, `aria-live`, bookmark + share/copy actions  |
| `components/ShareQuoteButton.tsx`  | Web Share API first, clipboard fallback for `/q/[id]`      |
| `components/VoteButtons.tsx`       | Up/down vote controls with sign-in fallback                |
| `components/TopQuoteList.tsx`      | Client leaderboard rows + sign-in panel for votes          |
| `components/AccountPanel.tsx`      | Slide-in account + flat bookmarks list                     |
| `components/SidePanel.tsx`         | Shared right-hand drawer shell                             |
| `components/WelcomeBanner.tsx`     | Post-login welcome toast                                   |
| `components/SignInPanel.tsx`       | Slide-in magic-link form (home + permalink pages)          |
| `components/AuthStatus.tsx`        | Header profile control + bookmark count badge              |
| `lib/bookmarks.ts`                 | Bookmark CRUD helpers                                      |
| `lib/votes.ts`                     | Vote CRUD and leaderboard aggregation                      |
| `lib/rate-limit.ts`                | Per-IP `/api/randomQuote` and per-user `/api/votes` limits |
| `lib/request-body.ts`              | JSON-only body parsing and quote-id validation for writes  |
| `lib/auth.ts` / `lib/auth-server.ts` | Better Auth server config + session helper               |
| `lib/schema.ts`                    | Drizzle table definitions                                  |
| `drizzle/`                         | Versioned SQL migrations (committed)                       |

## Data model

See [`docs/10-data-model.md`](./10-data-model.md) for the ERD, class/module
map, runtime flows, and schema-change checklist.

```ts
quotes(id, text, book, author, language, category, length)

// Better Auth (auto-managed)
user, session, account, verification

bookmarks(id, user_id → user, quote_id → quotes, created_at)
  unique (user_id, quote_id)

quote_votes(id, user_id → user, quote_id → quotes, value, created_at, updated_at)
  unique (user_id, quote_id)
  check value in (-1, 1)
```

300 quote rows seeded from `scripts/quotes.json`.

## Auth UX flow

1. Guest clicks **Войти** or **В закладки** → `SignInPanel` slides in from the right.
2. Login mode asks for email only; registration mode asks for name + email.
3. User submits → "Проверь почту" confirmation (animated).
4. User clicks magic link in email → Better Auth verifies → redirect to `/?welcome=1`.
5. Home shows `WelcomeBanner`; session appears in the header account menu.
6. Auth changes broadcast across tabs so stale sign-in panels close and session
   UI refreshes.
7. `/sign-in` redirects to home with `?signIn=1`; `/bookmarks` opens the account panel on home.

See [`docs/07-auth.md`](./07-auth.md) for env vars and E2E details.

## Rendering

- Home is a client component (button state, keyboard shortcut, panel).
- `randomQuote`, bookmarks, votes, leaderboard, and quote detail are force-dynamic.
- `allQuotes` is force-dynamic so CI/build never masks a broken DB connection
  by prerendering a caught error response.
- `/q/[id]/opengraph-image` generates PNG cards via `ImageResponse`.

## Rate limiting

`/api/randomQuote` checks `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN` and uses Upstash REST pipelining when configured.
Without those env vars it falls back to a per-instance in-memory bucket for
local development and tests. Responses include `X-RateLimit-*` headers, and
429 responses include `Retry-After`.

## Theming

A blocking inline script in `<head>` reads `localStorage.theme` (or
`prefers-color-scheme`) and sets `<html data-theme="...">` **before paint**, so
there is no flash of wrong theme. The `ThemeToggle` component subscribes to the
`storage` event via `useSyncExternalStore`.
