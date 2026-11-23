# Owner actions

Things only the repo owner can do (accounts, dashboards, the local machine).
Agents add items here and never tick them; the owner ticks them.

## Open

- [ ] **Enable auto-renew for `pelevin-like.app`** in Vercel → Domains. The
      domain expires on 2027-05-29. If it lapses, the site and the magic-link
      sender domain stop working.
- [ ] **Sync your local checkout** after the 2026-11-23 agent run. Your
      uncommitted copy of the voting feature is now on `main`, with review
      fixes on top. Keep the old copy as a stash until you have checked it:

      ```bash
      cd ~/DevTools/Repos-Dev/pelevin-quotes
      git stash push --include-untracked -m "local copy before 2026-11-23 sync"
      git pull --ff-only origin main
      nvm use            # Node 24, from .nvmrc
      npm ci
      git stash show --include-untracked --stat stash@{0}   # what the old copy had
      git stash drop stash@{0}                               # once you are happy
      git branch -d orch/2026-11-23                          # agent's local branch, merged
      ```

      `.env.local` is git-ignored, so the stash does not touch it.
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
