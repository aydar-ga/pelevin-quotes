# Changelog

All notable changes to this project will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Signup-only name field for magic-link registration; login mode remains
  email-only and unknown-login emails no longer create unnamed users.
- Cross-tab auth and bookmark state broadcasts so stale sign-in panels close
  and bookmark counts update immediately.
- Product voice guide (`docs/08-product-voice.md`) and local AI feature branch
  continuity note (`docs/09-ai-feature-branch.md`).
- Visual data model guide (`docs/10-data-model.md`) covering DB relations,
  runtime class/module links, request-to-schema decisions, and future AI table
  boundaries.
- Community submissions / AI-or-not guessing game product note
  (`docs/11-community-game.md`) added as the next feature candidate.
- Public quote ranking with `quote_votes`, `/api/votes`, vote controls on quote
  surfaces, and `/top` weekly / all-time leaderboards.
- `/api/randomQuote` rate limiting with Upstash Redis REST support and a
  per-instance memory fallback for local development.
- Bookmarks: `bookmarks` table, `/api/bookmarks`, `/bookmarks` page, heart toggle
  on quote cards, header badge with saved count
- Shareable quote permalinks at `/q/[id]` with copy / native share actions
- Per-quote Open Graph images via `next/og` (`app/q/[id]/opengraph-image.tsx`)
- Slide-in `SignInPanel` on the home page; `/sign-in` redirects to `/?signIn=1`
- Post-login `WelcomeBanner` on `/?welcome=1`
- Space keyboard shortcut on home to fetch a new quote
- Vercel Analytics + Speed Insights (free tier)
- Drizzle migrations: `drizzle/0000_add_bookmarks.sql`, `npm run db:generate`,
  `npm run db:migrate`; automated on Vercel via `vercel-build`
- Magic-link authentication via Better Auth (MIT) with the Drizzle adapter
- `/sign-in` page + server-protected `/me` page + sign-out
- Resend integration in `lib/email.ts` (no-ops gracefully without API key)
- Playwright E2E tests for dev-login auth, account panel, API routes,
  bookmarks, and session state
- `auth`-related tables (`user`, `session`, `account`, `verification`) pushed
  to Neon
- `npm run test:e2e` script
- `docs/07-auth.md`
- Custom domain `pelevin-like.app` (Vercel-registered, Vercel DNS); legacy
  `pelevin-quotes.vercel.app` aliases to it.
- Resend sending domain verified on the apex (`pelevin-like.app`,
  Frankfurt region) — SPF / DKIM / MX records live in Vercel DNS.
- `AUTH_EMAIL_FROM=noreply@pelevin-like.app` env var so Better Auth sends
  from the verified sender; magic links now deliver to any inbox.

### Changed

- README rewritten as a visitor showcase with prod screenshots; stack,
  scripts, shipped log and technical roadmap moved to `docs/DEVELOPMENT.md`.
- Auth panel copy and styling tightened to match the minimal product voice.
- Share actions now use native Web Share when available, otherwise copy quote
  text + source + permalink, with a permalink fallback when clipboard is
  unavailable.
- `/api/allQuotes` is now force-dynamic to avoid build-time database access.
- Node.js 24 is pinned in `package.json` `engines` (Vercel honours it over the
  project setting) and `.nvmrc` (CI reads it). Vercel had been building on
  Node 20, which it now refuses as discontinued.

### Security

- Security headers on every route: HSTS, `nosniff`, strict referrer policy,
  `Permissions-Policy`, `X-Frame-Options: DENY`, no `X-Powered-By`, and a
  report-only CSP with `frame-ancestors 'none'`; asserted in unit and e2e
  tests.
- One Zod-validated env module (`lib/env.ts`) is the only reader of
  `process.env` in app code. No secret fallbacks: a missing or short
  `BETTER_AUTH_SECRET`, or missing Resend config in Production, now fails the
  request closed instead of signing with a default or silently dropping
  sign-in emails. The database and Better Auth are created on first use, so
  builds need no env vars.
- `/dev/login` and `/api/test/last-magic-link` return 404 in Vercel Production
  even if a test flag is set; magic links are no longer kept in memory outside
  dev/e2e test mode.
- Dependencies updated within their semver ranges, and version floors raised
  for security-relevant packages: better-auth 1.6.11 → 1.7.27 (critical
  advisories, including pre-account hijacking on magic-link sign-in),
  next 16.2.6 → 16.4.6 (critical), react/react-dom 19.3.1, drizzle-orm 0.45.4,
  postcss 8.5.33, vitest 4.1.12. `npm audit`: 27 findings (2 critical, 10 high,
  15 moderate) → 4 moderate, all in drizzle-kit's dev-only `@esbuild-kit`.
- Playwright 1.60 → 1.65.1: GitHub's `ubuntu-latest` is now Ubuntu 26.04,
  which Playwright 1.60 cannot install browsers on.
- `/dev/login` sends an `Origin` header; better-auth 1.7 rejects origin-less
  POSTs that carry fetch-metadata headers (Node's `fetch` sends them).

### Fixed

- `/api/votes` and `/api/bookmarks` return `400` for malformed or non-JSON
  bodies and out-of-range ids instead of `500`. They require
  `Content-Type: application/json`, which plain cross-site forms cannot send.
- `/api/votes` returns `404` for unknown quotes and `429` after 30 votes per
  user per minute (`VOTE_RATE_LIMIT`). Toggling is atomic (`DELETE … RETURNING`
  then `INSERT … ON CONFLICT`), so double clicks no longer hit the unique index.
- The weekly `/top` board shows the viewer's own vote even when it is older than
  7 days.
- Vote buttons on the home page follow the current quote instead of keeping
  the previous quote's score and pressed state.
- `/dev/login` works on a fresh database again (it registers with
  `intent=sign-up`). Login lookups lowercase the email. Sign-up without a name
  is rejected on the server.
- Rate limiting falls back to memory when Upstash is unreachable. The memory
  fallback evicts expired keys and caps the map at 5,000 entries.
- Cancelling the native share sheet no longer throws. A refused share falls
  back to copying the link.
- `0001_add_quote_votes.sql` is idempotent, so a database that already has
  `quote_votes` (e.g. after `db:push`) does not fail the Vercel build.
- Vitest passes on Node 25+, whose built-in `localStorage` shadowed jsdom's.
- `BETTER_AUTH_URL` now points to `https://pelevin-like.app` (was the
  `*.vercel.app` URL).

## [2.0.0] - 2026-05-27

### Changed

- Upgraded to Next.js 16, React 19, Tailwind CSS v4, TypeScript 6, ESLint 9 (flat config)
- Migrated database from Supabase to Neon Postgres (provisioned via Vercel Marketplace)
- Replaced Supabase JS client with Drizzle ORM + `@neondatabase/serverless`
- Reseeded `quotes` table from the local `Pelevin_quotes__RU____sample_dataset.numbers` source (300 quotes)
- CI: switched to Node 24, added real lint + build steps, bumped GitHub Actions

## [1.0.0] - 2024-10-01

### Added

- Initial release of the project.

## [1.1.0] - 2024-01-27

### Added

- Updated API to ensure a new quote is always fetched on button click
- Made styling & wording changes on UI
