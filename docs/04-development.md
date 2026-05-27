# Development

## Prerequisites

- Node.js **24+**
- npm 10+
- `vercel` CLI: `npm i -g vercel`
- A Vercel account with access to the `pelevin-quotes` project

## First-time setup

```bash
git clone git@github.com:aydar-ga/pelevin-quotes.git
cd pelevin-quotes
npm install
vercel link --project pelevin-quotes
vercel env pull .env.local      # downloads DATABASE_URL
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Script               | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Next.js dev server (Turbopack)                        |
| `npm run build`      | Production build                                      |
| `npm run start`      | Serve the production build locally                    |
| `npm run lint`       | ESLint over the whole tree                            |
| `npm run type-check` | `tsc --noEmit`                                        |
| `npm test`           | Vitest, single run                                    |
| `npm run test:watch` | Vitest in watch mode                                  |
| `npm run test:coverage` | Vitest with v8 coverage → `coverage/index.html`    |
| `npm run db:push`    | Apply `lib/schema.ts` changes to Neon                 |
| `npm run db:seed`    | Drop + reseed `quotes` (destructive)                  |

## Precommit hook

Husky runs on `git commit`:

1. `lint-staged` → `eslint --fix` on staged TS/JS files
2. `npm run type-check`
3. `npm test -- --reporter=dot`

To bypass in an emergency: `git commit --no-verify` (please don't).

## Conventions

- **No new files unless necessary.** Prefer editing existing modules.
- **No comments** explaining *what* code does. Only *why*, when non-obvious.
- **No `any`.** Use Drizzle's inferred types (`typeof quotes.$inferSelect`).
- **Russian** in user-facing strings; English in code, comments, commit
  messages, docs.
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.

## Adding a quote

1. Edit `scripts/quotes.json`.
2. `npm run db:seed` (locally; CI does not seed).
3. Commit.

The roadmap (README) calls for a real submission flow — until then, JSON is
the source of truth.
