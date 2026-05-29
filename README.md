## About 📖

A minimalist web app that serves witty quotes from Viktor Pelevin's works. Hit
the button, get a fresh dose. Inspired by the spirit of his books — sharp
satire on the slightly absurd nature of our reality.

Live: **<https://pelevin-like.app>**

## Tech stack 🤖

- **Next.js 16** (App Router) on **Node.js 24**
- **React 19**, **Tailwind CSS v4**, **TypeScript 6**
- **Neon Postgres** (serverless) via Vercel Marketplace
- **Drizzle ORM** for typed queries & migrations
- **Better Auth** (MIT) with magic-link sign-in
- **Resend** for transactional email (optional; falls back to logging)
- **@vercel/analytics** + **@vercel/speed-insights** (free tier — page views & Web Vitals)
- **Vitest** + **Testing Library** for unit tests (TDD by default — see below)
- **Playwright** + **mail.tm** for E2E (auth flow against a real temp inbox)
- **Husky** + **lint-staged** for the precommit gate
- **Vercel** for hosting & CI/CD
- **GitHub Actions** for lint / type-check / test / build

## Local development 🛠️

```bash
npm install
vercel link                    # link to the Vercel project
vercel env pull .env.local     # download DATABASE_URL (Neon)
npm run db:seed                # one-off: seed 300 quotes into Neon
npm run dev
```

Open <http://localhost:3000>.

## Project scripts

| Script                  | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Start Next.js dev server                         |
| `npm run build`         | Production build                                 |
| `npm run vercel-build`  | Vercel build: migrate (if on Vercel) + `build`   |
| `npm run lint`          | ESLint (flat config)                             |
| `npm run type-check`    | `tsc --noEmit`                                   |
| `npm test`              | Vitest, single run                               |
| `npm run test:watch`    | Vitest in watch mode (TDD loop)                  |
| `npm run test:coverage` | Vitest with v8 coverage → `coverage/index.html`  |
| `npm run test:e2e`      | Playwright E2E (spawns a dedicated dev server)   |
| `npm run db:push`       | Push Drizzle schema to Neon (local prototyping)  |
| `npm run db:generate`   | Generate SQL migration from schema changes       |
| `npm run db:migrate`    | Apply pending migrations to Neon (production-safe) |
| `npm run db:seed`       | Reseed quotes table from `scripts/quotes.json`   |

## Testing & TDD ✅

Tests are not optional in this repo. **TDD is the default working style:**

1. Add or update a failing test in `tests/` (mirrors the source path).
2. Implement until that test — and every existing one — passes.
3. `npm test` must be green before commit.

The Husky pre-commit hook enforces this automatically:

```
lint-staged → tsc --noEmit → vitest run --reporter=dot
```

See [`docs/06-testing.md`](./docs/06-testing.md) for setup details and
[`AGENTS.md`](./AGENTS.md) / [`CLAUDE.md`](./CLAUDE.md) for the full agent rules.

## Documentation 📚

The README is the elevator pitch. Everything else lives in [`docs/`](./docs):

- [Architecture](./docs/01-architecture.md)
- [Framework selection & alternatives](./docs/02-framework-selection.md)
- [Database](./docs/03-database.md)
- [Development](./docs/04-development.md)
- [Deployment](./docs/05-deployment.md)
- [Testing](./docs/06-testing.md)
- [Authentication](./docs/07-auth.md)

AI assistants pick up rules from [`AGENTS.md`](./AGENTS.md) (Codex / Cursor /
Aider / Continue), [`CLAUDE.md`](./CLAUDE.md), `.cursorrules`, and
`.github/copilot-instructions.md` — all kept in sync.

> 🤖 **README hygiene rule:** every code change that affects the pitch, stack,
> scripts, or roadmap must update this file in the **same commit**. Enforced by
> agent rules; please respect it in human PRs too.

## Shipped ✅

- **Custom domain** `https://pelevin-like.app` — owned, on Vercel DNS.
- **Magic-link auth** via Better Auth (MIT, OSS). Passwordless slide-in panel on
  the home page; `/sign-in` redirects there. After email verification users land
  on `/` with a welcome banner and an account menu in the header.
- **Bookmarks** — logged-in users save quotes with a heart button; `/bookmarks`
  lists saved items; header badge shows the count.
- **Shareable permalinks** at `/q/[id]` with copy / native share actions.
- **Per-quote Open Graph images** — dynamic PNG cards via `next/og` for Telegram,
  VK, X previews.
- **Vercel Analytics + Speed Insights** — free page-view and Web Vitals telemetry.
- **Drizzle migrations** — versioned SQL in `drizzle/`; Vercel runs
  `db:migrate` automatically before each deploy (`vercel.json` → `vercel-build`).
- **Real email delivery** via Resend with a verified sender domain
  (`noreply@pelevin-like.app`). Magic links arrive in any inbox — Gmail,
  temp-mail, ProtonMail, etc.
- **Playwright E2E** covering the full auth flow against a real temp inbox
  (mail.tm) — see [`e2e/auth.spec.ts`](./e2e/auth.spec.ts).
- Dark / light theme with FOUC-free bootstrap and a toggle
- Copy / share actions on quote cards; Space bar fetches a new quote on home
- Inline error feedback with retry on API failures
- 8-bit pixel-art Pelevin portrait used as header avatar, dynamic favicon,
  social card, and empty-state illustration
- Migrated database from Supabase to Neon (Vercel Marketplace)
- Vitest + Testing Library + jsdom test suite
- Husky pre-commit gate (lint-staged → type-check → tests)
- Project-wide AI-agent rules (CLAUDE.md, AGENTS.md, .cursorrules, copilot)

## Roadmap 🏁

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
      remove devices.
- [ ] **AI quote generation.** Stream synthetic "Pelevin-style" quotes via the
      Vercel AI SDK (AI Gateway). Mark generated quotes clearly as AI-authored
      and store them in a separate `ai_quotes` table so they never pollute the
      canonical dataset.
- [ ] **Community submissions.** Authenticated users can propose new quotes
      with source / book metadata. Submissions land in a `pending` queue and
      become public after lightweight moderation.
- [ ] **Public ranking.** Up / down-vote quotes; surface a `/top` leaderboard
      with trending (last 7d) and all-time tabs. Use a materialised view or
      Neon's read replicas to keep the hot read path cheap.

### Infra / quality

- [ ] Run Playwright E2E in CI (smoke + auth path).
- [ ] Rate-limiting on `/api/randomQuote` via Upstash Redis to keep AI
      generation costs predictable once enabled.
