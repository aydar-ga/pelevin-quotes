# GitHub Copilot / Copilot Chat instructions

This repo's full agent guidance lives in [`/AGENTS.md`](../AGENTS.md) and
[`/CLAUDE.md`](../CLAUDE.md), with deep documentation under [`/docs/`](../docs).

## TL;DR for inline completions

- Next.js 16 (App Router, React 19), Drizzle ORM, Neon Postgres, Vercel.
- **TDD is the default.** Suggest a failing test in `tests/` *before* the
  implementation. Never propose code that ships without a test.
- **README stays in sync.** When suggesting a change that affects the pitch,
  stack, scripts, "Shipped", or roadmap, also suggest the matching README edit
  in the same change set.
- TypeScript strict — never use `any`; use Drizzle's inferred types.
- Tests live under `tests/`, written with Vitest + Testing Library.
- Don't co-locate tests with sources.
- Don't add "what" comments; only "why", when non-obvious.
- Russian for user-facing copy; English everywhere else.
- Don't suggest Supabase — we migrated off it (CHANGELOG v2.0.0).

## Suggested verification

```
npm run lint && npm run type-check && npm test && npm run build
```
