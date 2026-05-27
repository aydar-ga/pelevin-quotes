## About 📖

A minimalist web app that serves witty quotes from Viktor Pelevin's works. Hit
the button, get a fresh dose. Inspired by the spirit of his books — sharp
satire on the slightly absurd nature of our reality.

## Tech stack 🤖

- **Next.js 16** (App Router) on **Node.js 24**
- **React 19**, **Tailwind CSS v4**, **TypeScript 6**
- **Neon Postgres** (serverless) via Vercel Marketplace
- **Drizzle ORM** for typed queries & migrations
- **Vercel** for hosting & CI/CD
- **GitHub Actions** for lint / type-check / build

## Local development 🛠️

```bash
npm install
vercel link            # link to the Vercel project
vercel env pull .env.local   # download Neon connection string
npm run db:seed        # one-off: seed 300 quotes into Neon
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project scripts

| Script              | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start Next.js dev server               |
| `npm run build`     | Production build                       |
| `npm run lint`      | ESLint (flat config)                   |
| `npm run type-check`| `tsc --noEmit`                         |
| `npm run db:push`   | Push Drizzle schema to Neon            |
| `npm run db:seed`   | Reseed quotes table from `scripts/quotes.json` |

## Roadmap 🏁

### UI / UX

- [ ] **Pelevin avatar / iconography.** Commission (or AI-generate) a stylised
      Viktor Pelevin face/silhouette in a single consistent visual language and
      use it across the header, favicon, social cards and empty states to give
      the site a recognisable identity.
- [ ] **Dark & light theme.** System-aware by default with a manual toggle
      persisted to `localStorage`. Wire CSS variables in `globals.css` and a
      `<ThemeProvider>` in `app/layout.tsx`.
- [ ] **Graceful error & loading feedback.** Replace silent `console.error`
      with user-visible toasts / inline messages for fetch failures, empty
      states and rate-limit responses.

### Features

- [ ] **Auth flow.** Add sign-in (email magic link + GitHub/Google) via a
      Vercel-Marketplace provider (Clerk or Auth.js + Neon). Required as the
      foundation for everything below.
- [ ] **Bookmarks.** Logged-in users can ❤️ a quote; persist `(user_id, quote_id)`
      in a `bookmarks` table and expose `/bookmarks` page.
- [ ] **AI quote generation.** Stream synthetic "Pelevin-style" quotes via the
      Vercel AI SDK (AI Gateway). Mark generated quotes clearly as AI-authored
      and store them in a separate `ai_quotes` table so they never pollute the
      canonical dataset.
- [ ] **Community submissions.** Authenticated users can propose new quotes
      with source/book metadata. Submissions land in a `pending` queue and
      become public after lightweight moderation.
- [ ] **Public ranking.** Up/down-vote quotes; surface a `/top` leaderboard
      with trending (last 7d) and all-time tabs. Use a materialised view or
      Neon's read replicas to keep the hot read path cheap.

### Infra / quality (nice-to-haves)

- [ ] Playwright smoke tests in CI (golden path: load page → fetch quote → render).
- [ ] OpenGraph / Twitter card images per quote (generated via `@vercel/og`).
- [ ] Rate-limiting on `/api/randomQuote` via Vercel KV / Upstash to keep AI
      generation costs predictable once enabled.
