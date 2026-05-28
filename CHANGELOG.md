# Changelog

All notable changes to this project will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Magic-link authentication via Better Auth (MIT) with the Drizzle adapter
- `/sign-in` page + server-protected `/me` page + sign-out
- Resend integration in `lib/email.ts` (no-ops gracefully without API key)
- Playwright E2E test (`e2e/auth.spec.ts`) covering the full auth flow against
  a real mail.tm temp inbox
- `auth`-related tables (`user`, `session`, `account`, `verification`) pushed
  to Neon
- `npm run test:e2e` script
- `docs/07-auth.md`

## [2.0.0] - 2026-05-27

### Changed

- Upgraded to Next.js 16, React 19, Tailwind CSS v4, TypeScript 6, ESLint 10 (flat config)
- Migrated database from Supabase to Neon Postgres (provisioned via Vercel Marketplace)
- Replaced Supabase JS client with Drizzle ORM + `@neondatabase/serverless`
- Reseeded `quotes` table from the local `Pelevin_quotes__RU____sample_dataset.numbers` source (300 quotes)
- CI: switched to Node 24, added real lint + build steps, bumped GitHub Actions

## [1.0.0] - 2024-10-01

### Added

- Initial release of the project.

## [1.1.0] - 2024-27-01

### Added

- Updated API to ensure a new quote is always fetched on button click
- Made styling & wording changes on UI
