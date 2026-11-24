# AGENTS.md

Cross-tool agent guidance — used by OpenAI Codex, Cursor, Aider, Continue,
Sourcegraph Cody, Sweep, and any other AI coding tool that picks up
`AGENTS.md`.

This file is intentionally a thin pointer. The substantive guidance lives in:

- [`CLAUDE.md`](./CLAUDE.md) — same content, Claude-Code-flavoured filename
- `../ag-dev-meta/projects/pelevin-quotes/docs/` — full project documentation, in the owner's private notes (this repo is public)

Keep `AGENTS.md` and `CLAUDE.md` in sync if you edit either.

---

## TL;DR

A minimalist Next.js app that serves random Pelevin-style quotes (original lines, not real Pelevin quotes) from a Neon
Postgres table. Deployed on Vercel.

```
Next.js 16 (App Router, React 19) ──▶ Drizzle ORM ──▶ Neon Postgres
                  │
                  └──▶ Vercel (hosting + CI/CD)
```

## Where to look first

This repository is public. Its internal docs live in the owner's private notes at `../ag-dev-meta/projects/pelevin-quotes/docs/`. Start with `README.md` there (the index), then `DEVELOPMENT.md` (stack, scripts, shipped log, technical roadmap), the numbered guides `01-architecture.md` to `11-community-game.md`, and `owner-actions.md`.

**Never commit internal notes to this repo:** owner actions, incident or rotation logs, security rationale and thresholds, monitoring setup, account plans, audits, roadmaps or changelogs. They go in the private docs.

## Hard rules

- **TDD is the default.** Every code change in `app/`, `components/`, or
  `lib/` ships with a test in `tests/`. Write the failing test first, then
  make it pass. Never commit with a red suite.
- **Keep the docs in sync, README stays non-technical.** `README.md` is a
  visitor showcase: no stack, commands, env vars or infra. Stack, scripts,
  "Shipped" and the technical roadmap live in the private `DEVELOPMENT.md`; update it
  *in the same change set* as the change. Visitor-visible changes (features,
  roadmap status) also update the README's showcase sections.
- **Don't reintroduce Supabase.** Migrated away intentionally (v2.0.0).
- **Don't add comments explaining *what* code does.** Only *why*, when non-obvious.
- **Don't co-locate tests next to source files.** Put them in `tests/`.
- **Don't use `any`.** Use Drizzle's inferred types.
- **Don't bypass the precommit hook** (`--no-verify`) unless a human asks.
- **Don't run `npm run db:seed` against production.** It drops the table.
- **User-facing copy is Russian.** Keep it cool, sharp, compact, and informal;
  see the private `08-product-voice.md`. Code/comments/commits/docs are English.

## Automatic workflow (every code change)

1. Add or update a failing test under `tests/`.
2. Implement the change.
3. Run `npm run lint && npm run type-check && npm test && npm run build`.
4. Update the private `DEVELOPMENT.md` (and any relevant private docs page) if the stack,
   scripts, "Shipped", or the roadmap changed; update the README showcase if
   visitors would notice.
5. Commit (precommit hook re-runs lint-staged + type-check + tests).
6. Push.

## Programmatic checks (must pass)

```bash
npm run lint
npm run type-check
npm test
npm run build
```

Precommit hook runs the first three on every commit. CI runs lint,
type-check, Vitest, Playwright E2E, and build on pushes / PRs.

## Common tasks

| You want to…                              | Run / edit                                          |
| ----------------------------------------- | --------------------------------------------------- |
| Add a quote                               | Edit `scripts/quotes.json` → `npm run db:seed` (local) |
| Add a column                              | Edit `lib/schema.ts` → `npm run db:generate` → `npm run db:migrate` |
| Add a UI component                        | New file under `components/` + test in `tests/`     |
| Add an API route                          | `app/api/<name>/route.ts` (App Router conventions)  |
| Change theme colours                      | CSS variables in `app/globals.css`                  |
| Tweak the precommit hook                  | `.husky/pre-commit`                                 |

## Deployment

`git push origin main` → production. Manual: `vercel deploy --prod`.
See the private `05-deployment.md`.
