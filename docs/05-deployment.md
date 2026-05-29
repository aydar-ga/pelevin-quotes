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

Managed in the Vercel dashboard (or `vercel env`). The only required one is
`DATABASE_URL` (auto-injected by the Neon Marketplace integration). Everything
else (`POSTGRES_*`, `PG*`) is duplicate metadata kept for compatibility.

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

`.github/workflows/ci.yml` runs on `push` (non-main) and on PRs into
`main`/`develop`:

```
npm ci → npm run lint → npm run type-check → npm run build
```

CI does **not** run the seed script and does **not** require a real
`DATABASE_URL` (the build only uses it at runtime).

## Database migrations

Migrations run **automatically** on every Vercel build (production and preview)
via `vercel.json` → `npm run vercel-build` → `db:migrate` → `next build`.
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
