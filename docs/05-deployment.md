# Deployment

## Targets

| Environment | URL                                  | Trigger                          |
| ----------- | ------------------------------------ | -------------------------------- |
| Production  | https://pelevin-quotes.vercel.app    | `git push origin main`           |
| Preview     | `https://pelevin-quotes-<sha>.vercel.app` | Any other branch / PR      |
| Local       | http://localhost:3000                | `npm run dev`                    |

## How it deploys

Vercel watches the `main` branch on GitHub. Every push:

1. Vercel installs deps (cached) and runs `next build`.
2. Bundles route handlers as Fluid Compute Functions.
3. Promotes the resulting deployment to the `pelevin-quotes.vercel.app` alias.

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
