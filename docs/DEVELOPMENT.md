# Development — maintainer notes

The [README](../README.md) is the visitor-facing showcase and carries no
technical detail. Everything technical starts here.

## Tech stack

- **Next.js 16** (App Router) on **Node.js 24**
- **React 19**, **Tailwind CSS v4**, **TypeScript 6**
- **Neon Postgres** (serverless) via Vercel Marketplace
- **Drizzle ORM** for typed queries and migrations
- **Better Auth** (MIT) with magic-link sign-in
- **Resend** for transactional email
- **Upstash Redis REST** for optional shared API rate limiting
- **@vercel/analytics** + **@vercel/speed-insights** (free tier: page views and Web Vitals)
- **Vitest** + **Testing Library** for unit tests (TDD by default)
- **Playwright** for E2E: API routes + dev-login auth (no Resend emails in CI)
- **Husky** + **lint-staged** for the pre-commit gate
- **Vercel** for hosting and deploys; **GitHub Actions** for CI

## Local development

```bash
npm install
vercel link                    # link to the Vercel project
vercel env pull .env.local     # download DATABASE_URL (Neon)
npm run db:seed                # one-off, local DB only: seed 300 quotes
npm run dev
```

Open <http://localhost:3000>. Full setup, the dev test user and conventions:
[04-development.md](./04-development.md).

## Project scripts

| Script                  | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Start Next.js dev server                           |
| `npm run build`         | Production build                                   |
| `npm run vercel-build`  | Vercel build: migrate (if on Vercel) + `build`     |
| `npm run lint`          | ESLint (flat config)                               |
| `npm run type-check`    | `tsc --noEmit`                                     |
| `npm test`              | Vitest, single run                                 |
| `npm run test:watch`    | Vitest in watch mode (TDD loop)                    |
| `npm run test:coverage` | Vitest with v8 coverage → `coverage/index.html`    |
| `npm run test:e2e`      | Playwright E2E (spawns a dedicated server)         |
| `npm run db:push`       | Push Drizzle schema to Neon (local prototyping)    |
| `npm run db:generate`   | Generate SQL migration from schema changes         |
| `npm run db:migrate`    | Apply pending migrations (production-safe)         |
| `npm run db:seed`       | Reseed quotes table from `scripts/quotes.json`     |

## Testing and TDD

Tests are not optional. **TDD is the default working style:**

1. Add or update a failing test in `tests/` (mirrors the source path).
2. Implement until that test, and every existing one, passes.
3. `npm test` must be green before commit.

The Husky pre-commit hook enforces it: `lint-staged → tsc --noEmit → vitest run --reporter=dot`.
Details: [06-testing.md](./06-testing.md).

## Documentation map

- [Architecture](./01-architecture.md)
- [Framework selection and alternatives](./02-framework-selection.md)
- [Database](./03-database.md)
- [Development setup](./04-development.md)
- [Deployment](./05-deployment.md)
- [Testing](./06-testing.md)
- [Authentication](./07-auth.md)
- [Product voice](./08-product-voice.md)
- [AI feature branch note](./09-ai-feature-branch.md)
- [Data model and visual maps](./10-data-model.md)
- [Community submissions and guessing game](./11-community-game.md)
- [Owner actions](./owner-actions.md)

AI assistants pick up rules from [`AGENTS.md`](../AGENTS.md) (Codex / Cursor /
Aider / Continue), [`CLAUDE.md`](../CLAUDE.md), `.cursorrules`, and
`.github/copilot-instructions.md`, all kept in sync.

> **Docs hygiene rule:** a change that affects the stack, scripts, "Shipped" or
> the roadmap updates this file in the same commit. A change visitors would
> notice (features, roadmap status, screenshots) also updates the README's
> showcase sections, still without technical detail.

## Shipped (technical log)

- **Custom domain** `https://pelevin-like.app` — owned, on Vercel DNS.
- **Magic-link auth** via Better Auth (MIT, OSS). Passwordless slide-in panel on
  the home page; login asks only for email, registration asks for name + email.
  After verification, tabs sync into the signed-in state and stale sign-in
  panels close.
- **Bookmarks** — logged-in users save quotes with a heart button; open the account side panel (profile icon) or visit `/bookmarks` (redirects home with the panel open)
  lists saved items in one flat feed; header badge updates immediately.
- **Shareable permalinks** at `/q/[id]` — quote action uses Web Share where
  available and copies the permalink as a fallback.
- **Public ranking** at `/top` — signed-in users vote quotes up/down; the page
  shows weekly and all-time leaders.
- **Rate-limited random quote API** — `/api/randomQuote` emits rate-limit
  headers and uses Upstash Redis REST when env vars are present, with a local
  in-memory fallback for dev.
- **Per-quote Open Graph images** — dynamic PNG cards via `next/og` for Telegram,
  VK, X previews.
- **Vercel Analytics + Speed Insights** — free page-view and Web Vitals telemetry.
- **Drizzle migrations** — versioned SQL in `drizzle/`; Vercel runs
  `db:migrate` automatically before each deploy (`vercel.json` → `vercel-build`).
- **Real email delivery** via Resend with a verified sender domain
  (`noreply@pelevin-like.app`). Magic links arrive in any inbox — Gmail,
  temp-mail, ProtonMail, etc.
- **Documented UX voice** — Russian copy stays cool, sharp, compact, and
  informal; see [`08-product-voice.md`](./08-product-voice.md).
- **Playwright E2E** — dev-login auth + account panel (`e2e/auth.spec.ts`); runs in GitHub Actions CI.
- **Playwright API E2E** — quote, bookmark, and session routes in
  [`e2e/api.spec.ts`](../e2e/api.spec.ts); runs in GitHub Actions CI.
- Dark / light theme with FOUC-free bootstrap and a toggle
- Heart + permalink link actions on quote cards; Space bar fetches a new quote on home
- Inline error feedback with retry on API failures
- 8-bit pixel-art Pelevin portrait used as header avatar, dynamic favicon,
  social card, and empty-state illustration
- Migrated database from Supabase to Neon (Vercel Marketplace)
- Vitest + Testing Library + jsdom test suite
- Husky pre-commit gate (lint-staged → type-check → tests)
- Project-wide AI-agent rules (CLAUDE.md, AGENTS.md, .cursorrules, copilot)

## Roadmap (technical notes)

- [x] **Enforce the CSP.** Done 2026-11-24 after a clean report-only run in
      e2e and Production (see `docs/05-deployment.md` → Security headers).

### Features

- [ ] **Google OAuth via Better Auth.** Add `signIn.social({ provider: 'google' })`
      so users can sign in without an email round-trip. Removes the
      domain-verified-sender requirement for the primary signup path; magic
      link stays as a fallback. ~5 lines of config + a Google Cloud OAuth
      client + a `/privacy` page. See `docs/07-auth.md` for the full plan.
- [ ] **Yandex / Apple OAuth.** Locally relevant for the Russian audience;
      same plugin pattern as Google.
- [ ] **Passkeys / WebAuthn.** Better Auth's `passkey` plugin — one-tap
      repeat logins via Touch ID / Windows Hello / YubiKey. Additive on top
      of magic link / OAuth (still need one of those for first-time signup
      and device-loss recovery). `/settings/passkeys` page to register +
      remove devices. Skipped for now; current Better Auth package does not
      expose a passkey plugin export in this install.
- [ ] **AI quote generation.** Stream synthetic "Pelevin-style" quotes via the
      Vercel AI SDK (AI Gateway). Mark generated quotes clearly as AI-authored
      and store them in a separate `ai_quotes` table so they never pollute the
      canonical dataset. A local unpushed showcase branch exists at
      `feat/ai-quote-generation` (`9be73ef`); keep it off `main` for now.
- [ ] **Community submissions + guessing game.** Authenticated users can submit
      quotes into a moderated queue, vote on community quotes, and rank as
      authors. Add a second game loop where users guess whether a quote was
      human-written, from a book, or AI-generated; accurate evaluators climb a
      user leaderboard. See `docs/11-community-game.md`.
