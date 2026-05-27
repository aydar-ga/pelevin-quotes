# AGENTS.md

Cross-tool agent guidance — used by OpenAI Codex, Cursor, Aider, Continue,
Sourcegraph Cody, Sweep, and any other AI coding tool that picks up
`AGENTS.md`.

This file is intentionally a thin pointer. The substantive guidance lives in:

- [`CLAUDE.md`](./CLAUDE.md) — same content, Claude-Code-flavoured filename
- [`docs/`](./docs) — full project documentation

Keep `AGENTS.md` and `CLAUDE.md` in sync if you edit either.

---

## TL;DR

A minimalist Next.js app that serves random Pelevin quotes from a Neon
Postgres table. Deployed on Vercel.

```
Next.js 16 (App Router, React 19) ──▶ Drizzle ORM ──▶ Neon Postgres
                  │
                  └──▶ Vercel (hosting + CI/CD)
```

## Where to look first

| Doc                                                       | When you need it                              |
| --------------------------------------------------------- | --------------------------------------------- |
| [docs/01-architecture.md](./docs/01-architecture.md)      | Understand the module layout                  |
| [docs/02-framework-selection.md](./docs/02-framework-selection.md) | Why each library — before swapping anything |
| [docs/03-database.md](./docs/03-database.md)              | Schema, seeding, migrations                   |
| [docs/04-development.md](./docs/04-development.md)        | Scripts, conventions, local setup             |
| [docs/05-deployment.md](./docs/05-deployment.md)          | Vercel deploys, env vars, rollback            |
| [docs/06-testing.md](./docs/06-testing.md)                | Vitest + Testing Library                      |

## Hard rules

- **Don't reintroduce Supabase.** Migrated away intentionally (CHANGELOG v2.0.0).
- **Don't add comments explaining *what* code does.** Only *why*, when non-obvious.
- **Don't co-locate tests next to source files.** Put them in `tests/`.
- **Don't use `any`.** Use Drizzle's inferred types.
- **Don't bypass the precommit hook** (`--no-verify`) unless a human asks.
- **Don't run `npm run db:seed` against production.** It drops the table.
- **User-facing copy is Russian.** Code/comments/commits/docs are English.

## Programmatic checks (must pass)

```bash
npm run lint
npm run type-check
npm test
npm run build
```

Precommit hook runs the first three on every commit. CI re-runs them on push.

## Common tasks

| You want to…                              | Run / edit                                          |
| ----------------------------------------- | --------------------------------------------------- |
| Add a quote                               | Edit `scripts/quotes.json` → `npm run db:seed` (local) |
| Add a column                              | Edit `lib/schema.ts` → `npm run db:push`            |
| Add a UI component                        | New file under `components/` + test in `tests/`     |
| Add an API route                          | `app/api/<name>/route.ts` (App Router conventions)  |
| Change theme colours                      | CSS variables in `app/globals.css`                  |
| Tweak the precommit hook                  | `.husky/pre-commit`                                 |

## Deployment

`git push origin main` → production. Manual: `vercel deploy --prod`.
See [`docs/05-deployment.md`](./docs/05-deployment.md).
