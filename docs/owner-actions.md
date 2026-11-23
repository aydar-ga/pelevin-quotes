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
- [ ] **Sync your local checkout** after the 2026-11-23 agent run. Two things
      changed on GitHub: your uncommitted copy of the voting feature is now on
      `main` with review fixes, and the history was rewritten so that every
      commit credits only `aydar-ga` (the 2024 work-email commits and the
      Claude co-author lines were cleaned). File contents are unchanged, but
      commit IDs are new, so `git pull` will refuse. Run these in order:

      ```bash
      cd ~/DevTools/Repos-Dev/pelevin-quotes
      git stash push --include-untracked -m "local copy before 2026-11-23 sync"
      git fetch origin
      # Move your unpushed AI-toggle commit onto the new history.
      # Run this BEFORE the reset; `git rebase --abort` undoes it on conflict.
      git rebase --onto origin/main main feat/ai-quote-generation
      git checkout main
      git reset --hard origin/main
      git branch -D orch/2026-11-23                          # agent's branch, already on main
      nvm use && npm ci                                      # Node 24, from .nvmrc
      git stash show --include-untracked --stat stash@{0}   # what the old copy had
      git stash drop stash@{0}                               # once you are happy
      ```

      `.env.local` is git-ignored, so none of this touches it.
- [ ] **Optional: set Vercel → Settings → Node.js Version to 24.x.** Builds
      already use Node 24 because `package.json` `engines.node` overrides the
      dashboard value (still 20.x). Changing it only removes the build warning.
- [ ] **Optional: add Upstash Redis** (`UPSTASH_REDIS_REST_URL`,
      `UPSTASH_REDIS_REST_TOKEN`) to Production. Without it, the random-quote
      and vote rate limits are per serverless instance, not global. See
      [`05-deployment.md`](./05-deployment.md).

## Accepted, no action

- `npm audit` reports 4 moderate findings, all in `drizzle-kit`'s bundled
  `@esbuild-kit` (esbuild dev-server advisory). drizzle-kit never starts that
  server, and the only offered fix is downgrading drizzle-kit to 0.18.
