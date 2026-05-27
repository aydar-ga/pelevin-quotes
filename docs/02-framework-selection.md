# Framework & dependency selection

This document explains **why** each major piece of the stack was chosen and what
the realistic alternatives are. The trade-offs are listed so a future
contributor (human or AI) can re-evaluate cheaply.

## Frontend framework — Next.js 16 (App Router)

**Why:**
- First-class deployment story on Vercel (the chosen host) — zero config.
- App Router gives us Server Components for the shell + Client Components for
  the interactive button without a separate API gateway.
- Built-in route handlers (`app/api/**/route.ts`) replace the need for a custom
  backend.

**Alternatives considered:**

| Option         | Why not (for this project)                                                          |
| -------------- | ----------------------------------------------------------------------------------- |
| **Remix / React Router v7** | Equally good DX, but no advantage on Vercel and a smaller ecosystem for AI/integrations we plan to add. |
| **SvelteKit**  | Smaller bundles, but the AI-SDK / Vercel integration story is Next-first.           |
| **Astro**      | Excellent for content sites; overkill abstractions for one interactive button.      |
| **Plain Vite + React** | Would require a separate API server (Hono/Express) — extra ops surface.     |

If the app stays this tiny forever, Astro or Vite would be slightly leaner. The
moment we add auth, AI streaming, or per-user data (all on the roadmap), Next.js
on Vercel becomes the clear pick.

## Hosting — Vercel

**Why:** Git-push deploys, free preview URLs per branch/PR, AI SDK + Marketplace
integrations (Neon, Clerk, AI Gateway) wired in by one CLI command.

**Alternatives:**

| Option           | Why not                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| **Netlify**      | Comparable, but worse Next.js parity (ISR, Cache Components, AI Gateway).   |
| **Cloudflare Pages** | Edge-only mental model; harder for Drizzle + Postgres + future cron.     |
| **Self-hosted (Docker on Fly/Render)** | More control, more ops; we don't need it yet.           |

## Database — Neon Postgres (serverless)

**Why:**
- Real Postgres → full SQL, joins, full-text search later (`tsvector`).
- Serverless driver works in Vercel Functions/Edge with no connection pooling
  hell.
- Provisioned through the Vercel Marketplace, so env vars and billing live
  next to the deployment.
- Branch-per-PR databases are a free win when we start mutating data.

**Alternatives:**

| Option                | Why not                                                              |
| --------------------- | -------------------------------------------------------------------- |
| **Supabase (previous)** | Solid, but bundles auth/storage/realtime that we weren't using; the JS client added latency vs. a raw SQL driver. |
| **PlanetScale (MySQL)** | Branching is nice; MySQL is awkward for our future `tsvector` / `jsonb` plans. |
| **Turso (libSQL/SQLite)** | Great for read-heavy embedded use; weaker for concurrent writes & community features. |
| **Upstash Redis**     | Not a primary store; will likely come in for rate-limiting/caching.   |
| **Vercel KV / Postgres** | Discontinued as standalone Vercel products — use Marketplace.     |

## ORM / query layer — Drizzle

**Why:**
- Generates real TypeScript types from the schema with **zero runtime cost**
  (no Prisma engine, no codegen step in CI).
- Works seamlessly with the Neon HTTP driver.
- Migrations as plain SQL files — easy to review, easy to roll back.

**Alternatives:**

| Option        | Why not                                                                |
| ------------- | ---------------------------------------------------------------------- |
| **Prisma**    | Heavier (separate engine binary), slower cold start on Functions.      |
| **Kysely**    | Excellent typed query builder, but smaller migration story.            |
| **Raw `pg` / `postgres.js`** | We'd lose schema-driven types; fine for 1 table, painful at 5+. |

## Styling — Tailwind CSS v4

**Why:** v4 dropped the JS config and a long-running PostCSS chain; one
`@import "tailwindcss"` line in `globals.css` is the whole setup. Already the
team standard.

**Alternatives:** CSS Modules (verbose), vanilla-extract (extra build step),
shadcn (we'd adopt it the moment we need more than one bespoke component —
already on the roadmap).

## Testing — Vitest + Testing Library

**Why:**
- Vite-native, instant startup, same config language as the rest of the modern
  TS ecosystem.
- React Testing Library encourages testing user-visible behaviour, not
  implementation details.
- jsdom is enough for our component-level needs.

**Alternatives:**

| Option        | Why not                                                                |
| ------------- | ---------------------------------------------------------------------- |
| **Jest**      | Slower; needs separate ESM/TS config; no longer the modern default.    |
| **Playwright (component)** | Better fidelity but heavier; planned for **E2E**, not unit. |
| **Bun test**  | Fast, but ties us to Bun and lacks RTL ergonomics today.               |

## Precommit — Husky + lint-staged

**Why:** Smallest meaningful guarantee that `eslint`, `tsc`, and the unit
suite pass before a commit leaves the developer's machine. Husky's v9 install
is one line.

**Alternatives:** `simple-git-hooks` (lighter but less ergonomic),
`lefthook` (Go binary, fast, but extra install for contributors),
`pre-commit` (Python-based, mismatched ecosystem).

## CI — GitHub Actions

**Why:** Repo already lives on GitHub; Actions is free for public repos and
fine for our scale. CI runs the same `lint → type-check → test → build` chain
as the precommit hook.

**Alternatives:** CircleCI / Buildkite (overkill), Vercel-only checks (no
isolation from the deploy target).

## Linting — ESLint 9 + `eslint-config-next` (flat config)

**Why:** Flat config is the supported format in ESLint 9; `eslint-config-next`
ships flat-config sub-exports (`core-web-vitals`, `typescript`).
ESLint 10 was attempted first but its `eslint-plugin-react` bundled in
`eslint-config-next@16` is incompatible — pinned to 9.x until upstream catches
up.

**Alternative:** **Biome** — single-binary lint + format, very fast. Strong
candidate for a future swap once it covers React 19 / Next.js rules fully.
