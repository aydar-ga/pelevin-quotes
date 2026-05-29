# Architecture

A small Next.js app: random quotes, magic-link auth, bookmarks, and shareable
permalinks.

```
┌────────────────────┐       fetch        ┌──────────────────────────────┐
│  app/page.tsx      │ ─────────────────▶ │  /api/randomQuote            │
│  HomeClient        │                    │  /api/quotes/[id]            │
│  (React 19)        │                    │  /api/bookmarks              │
└─────────┬──────────┘                    │  /api/auth/[...all]          │
          │                               └──────────────┬───────────────┘
          │ SignInPanel / bookmarks                      │ drizzle-orm
          ▼                                              ▼
┌────────────────────┐                    ┌──────────────────────────────┐
│  /bookmarks        │                    │   Neon Postgres              │
│  /q/[id]           │                    │   quotes, user, session,     │
└────────────────────┘                    │   account, verification,     │
                                          │   bookmarks                  │
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
| `app/bookmarks/page.tsx`           | Logged-in user's saved quotes                              |
| `app/sign-in/page.tsx`             | Redirects to `/?signIn=1` (panel on home)                  |
| `app/api/randomQuote/route.ts`     | `GET` — `ORDER BY random() LIMIT 1`                        |
| `app/api/allQuotes/route.ts`       | `GET` — full list (ISR, revalidate 1h)                     |
| `app/api/bookmarks/route.ts`       | `GET` / `POST` — list and toggle bookmarks                 |
| `app/api/quotes/[id]/route.ts`     | `GET` — quote detail + bookmark state                      |
| `app/api/auth/[...all]/route.ts`   | Better Auth catch-all                                      |
| `components/QuoteCard.tsx`         | Quote display, `aria-live`, bookmark + share actions       |
| `components/SignInPanel.tsx`       | Slide-in magic-link form (home + permalink pages)          |
| `components/WelcomeBanner.tsx`     | Post-login welcome toast                                   |
| `components/AuthStatus.tsx`        | Header account menu + bookmark count badge                 |
| `lib/bookmarks.ts`                 | Bookmark CRUD helpers                                      |
| `lib/auth.ts` / `lib/auth-server.ts` | Better Auth server config + session helper               |
| `lib/schema.ts`                    | Drizzle table definitions                                  |
| `drizzle/`                         | Versioned SQL migrations (committed)                       |

## Data model

```ts
quotes(id, text, book, author, language, category, length)

// Better Auth (auto-managed)
user, session, account, verification

bookmarks(id, user_id → user, quote_id → quotes, created_at)
  unique (user_id, quote_id)
```

300 quote rows seeded from `scripts/quotes.json`.

## Auth UX flow

1. Guest clicks **Войти** or **В закладки** → `SignInPanel` slides in from the right.
2. User submits email → "Проверь почту" confirmation (animated).
3. User clicks magic link in email → Better Auth verifies → redirect to `/?welcome=1`.
4. Home shows `WelcomeBanner`; session appears in the header account menu.
5. `/sign-in` and `/bookmarks` (when logged out) redirect to home with `?signIn=1`.

See [`docs/07-auth.md`](./07-auth.md) for env vars and E2E details.

## Rendering

- Home is a client component (button state, keyboard shortcut, panel).
- `randomQuote`, bookmarks, and quote detail are force-dynamic.
- `allQuotes` uses 1h ISR — the canonical dataset rarely changes.
- `/q/[id]/opengraph-image` generates PNG cards via `ImageResponse`.

## Theming

A blocking inline script in `<head>` reads `localStorage.theme` (or
`prefers-color-scheme`) and sets `<html data-theme="...">` **before paint**, so
there is no flash of wrong theme. The `ThemeToggle` component subscribes to the
`storage` event via `useSyncExternalStore`.
