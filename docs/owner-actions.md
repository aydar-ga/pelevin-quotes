# Owner actions

Things only the repo owner can do (accounts, dashboards, the local machine).
Agents add items here and never tick them; the owner ticks them.

## Open

- [ ] **Rotate the Neon database password.** On 2026-11-23 an agent printed
      the `PGPASSWORD` from `.env.local` into its own tool output, so treat that
      password as exposed. In the Neon console, reset the role's password, then
      update `.env.local`. Check that Vercel's `DATABASE_URL`/`POSTGRES_*`
      variables picked up the new value; the Neon integration usually syncs
      them. If they didn't, update them and redeploy.
- [ ] **Enable auto-renew for `pelevin-like.app`** in Vercel → Domains. The
      domain expires on 2027-05-29. If it lapses, the site and the magic-link
      sender domain stop working.
- [ ] **Optional: add Upstash Redis** (`UPSTASH_REDIS_REST_URL`,
      `UPSTASH_REDIS_REST_TOKEN`) to Production. Without it, the random-quote
      and vote rate limits are per serverless instance, not global. See
      [`05-deployment.md`](./05-deployment.md).

## Done

- [x] **Vercel Node.js Version set to 24.x** (2026-11-24, via the Vercel API).
- [x] **`BETTER_AUTH_SECRET` added to Vercel Preview** (2026-11-24; its own
      random value, separate from Production). `BETTER_AUTH_URL` is optional
      outside Production, so preview sign-in uses the request origin.
- [x] **GitHub security turned on** (2026-11-24): private vulnerability
      reporting (so the `security.txt` link works), secret scanning, push
      protection, Dependabot alerts and security fixes, CodeQL default setup.

- [x] **Sync your local checkout** after the 2026-11-23 history rewrite. Done
      by the orchestrating agent on 2026-11-23: local `main` = `origin/main`
      (`48ac745`); `feat/ai-quote-generation` transplanted onto the rewritten
      base as `0f727e3`, Claude trailer stripped; backups kept as a stash and
      tags `backup/2026-11-23/*`.

## Accepted, no action

- `npm audit` reports 4 moderate findings, all in `drizzle-kit`'s bundled
  `@esbuild-kit` (esbuild dev-server advisory). drizzle-kit never starts that
  server, and the only offered fix is downgrading drizzle-kit to 0.18.
