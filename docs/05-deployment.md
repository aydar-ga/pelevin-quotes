# Deployment

## Targets

| Environment | URL                                  | Trigger                          |
| ----------- | ------------------------------------ | -------------------------------- |
| Production  | https://pelevin-like.app             | `git push origin main`           |
| Preview     | `https://pelevin-quotes-<sha>.vercel.app` | Any other branch / PR      |
| Local       | http://localhost:3000                | `npm run dev`                    |

The historical `pelevin-quotes.vercel.app` alias still resolves and 301s to
`pelevin-like.app`; old links keep working.

## How it deploys

Vercel watches the `main` branch on GitHub. Every push:

1. Vercel installs deps (cached) and runs `npm run vercel-build`.
2. `vercel-build` applies pending Drizzle migrations (`db:migrate`) when
   `VERCEL=1` and `DATABASE_URL` are set, then runs `next build`.
3. Bundles route handlers as Fluid Compute Functions.
4. Promotes the resulting deployment to the `pelevin-like.app` apex (with
   the legacy `pelevin-quotes.vercel.app` alias redirecting).

Preview deployments work identically but stay on their own URL.

## Manual deploy

```bash
vercel deploy            # preview
vercel deploy --prod     # production
```

## Environment variables

Managed in the Vercel dashboard (or `vercel env`).

Required:

- `DATABASE_URL` — Neon connection for quotes, bookmarks, votes, and Better Auth.
- `BETTER_AUTH_SECRET` — session-cookie signing secret, 32+ bytes.
- `BETTER_AUTH_URL` — public app URL, currently `https://pelevin-like.app`.

Production email:

- `RESEND_API_KEY` — sends real magic-link emails.
- `AUTH_EMAIL_FROM=noreply@pelevin-like.app` — verified sender domain.

Optional rate limiting:

- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST endpoint for durable rate limits.
- `UPSTASH_REDIS_REST_TOKEN` — standard REST token, server-side only.
- `RANDOM_QUOTE_RATE_LIMIT` — requests per window, default `60`.
- `RANDOM_QUOTE_RATE_LIMIT_WINDOW_SECONDS` — window length, default `60`.
- `VOTE_RATE_LIMIT` — `/api/votes` requests per signed-in user per window,
  default `30`.
- `VOTE_RATE_LIMIT_WINDOW_SECONDS` — window length, default `60`.

If Upstash env vars are absent, or Upstash is unreachable, both limits fall
back to an in-memory bucket per serverless instance (capped at 5,000 keys,
expired keys evicted first). That is fine for local development but not a
durable production limit across multiple instances.

Dev/test only:

- `DEV_TEST_AUTH`, `DEV_TEST_USER_EMAIL`, `NEXT_PUBLIC_DEV_TEST_AUTH`
- `E2E_TEST_MODE`

Everything else (`POSTGRES_*`, `PG*`) is duplicate metadata kept for
compatibility.

To sync locally:

```bash
vercel env pull .env.local
```

## Rollback

```bash
vercel rollback <deployment-url>
```

Or in the dashboard: Deployments → ⋯ → **Promote to Production**.

## CI

`.github/workflows/ci.yml` runs on pushes to `main`, `develop`, `feature/*`,
`fix/*`, `release/*`, and on PRs into `main` / `develop`.

The workflow has two jobs:

```
test:  npm ci → lint → type-check → Vitest → db:push → db:seed → Playwright E2E
build: npm ci → next build
```

The test job uses an ephemeral Postgres 16 service container, so it does not
need a Neon secret. The build job uses a placeholder `DATABASE_URL`; route
handlers that need the database must stay dynamic rather than querying during
`next build`.

## Database migrations

Migrations run **automatically** on every Vercel build (production and preview)
via `vercel.json` → `npm run vercel-build` → `db:migrate` → `next build`.
The `buildCommand` in `vercel.json` overrides the dashboard's default
"`npm run build`", so the dashboard setting is not the one that runs. Verify
in a build log: look for `[vercel-build] Running Drizzle migrations`.

Migrations run before `next build`. If the build then fails, the schema change
is already applied while the previous deployment keeps serving traffic, so
every migration must be additive and safe for the old code. Write DDL
idempotently (`IF NOT EXISTS`, `DO $$ … duplicate_object`) as in `0000` and
`0001`. Then a database that already has the object, for example after a
`db:push`, does not fail the build.

Preview builds migrate whatever database the Preview `DATABASE_URL` points at.
`DATABASE_URL` (and preferably `DATABASE_URL_UNPOOLED` for Drizzle Kit) must
be set in the Vercel project — Neon Marketplace injects both.

To apply migrations manually (e.g. before a `vercel deploy --prebuilt` workflow):

```bash
vercel env pull .env.local   # production or preview vars
npm run db:migrate
```

See [`docs/03-database.md`](./03-database.md). Never use `db:push` against
production.

## Analytics

1. In the [Vercel project dashboard](https://vercel.com), open **Analytics**
   (and **Speed Insights** if you want Web Vitals) and click **Enable** for
   the production environment.
2. Code: `@vercel/analytics/next` and `@vercel/speed-insights/next` in
   `app/layout.tsx`. No env vars required on Vercel (free on Hobby).
3. Deploy, then browse the live site — the dashboard may take ~30 seconds to
   leave the “Get Started” state after the first page views.
