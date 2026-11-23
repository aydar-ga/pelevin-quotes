# Authentication

Magic-link auth only — no passwords, no OAuth (yet). The UI has two modes:
login and registration.

## Library

**[Better Auth](https://www.better-auth.com)** (MIT, TypeScript-first), with
its built-in **Drizzle adapter** and **Magic Link plugin**.

Why magic link only (for v1):

- Implicit email verification — clicking the link proves inbox ownership.
- Login is one field. Registration asks for name + email so first-time users
  get a real Better Auth display name.
- Less code: sign-in and sign-up are the same form; no recovery flow.
- Easy to E2E-test against a temp-mail provider.

The classic password flow ends up being "sign in" + "forgot password → email
reset", which is just a magic link with extra steps.

## Architecture

```
┌────────────────┐  POST /sign-in    ┌──────────────────┐
│  SignInForm    │ ────────────────▶ │  /api/auth/...   │  ── Better Auth ──▶ Drizzle ──▶ Neon
│  (client)      │                    │  (route handler) │
└────────────────┘                    └────────┬─────────┘
                                               │ sendMagicLink callback
                                               ▼
                          ┌─────────────────────────────────┐
                          │  lib/email.ts: Resend if API     │
                          │  key set, otherwise mock+log     │
                          └─────────────────────────────────┘
                                               │
                                               ▼
                          ┌─────────────────────────────────┐
                          │  lib/magic-link-store.ts:        │
                          │  in-memory cache (E2E pickup)    │
                          └─────────────────────────────────┘
```

## Tables (auto-managed by Better Auth)

`user`, `session`, `account`, `verification` — declared in `lib/schema.ts`
and pushed with `npm run db:push`.

## Env vars

| Variable             | Required           | Purpose                                |
| -------------------- | ------------------ | -------------------------------------- |
| `DATABASE_URL`       | always             | Neon connection (Better Auth + app)    |
| `BETTER_AUTH_SECRET` | always             | Session-cookie signing key (32+ bytes) |
| `BETTER_AUTH_URL`    | always             | Public base URL (used in magic links)  |
| `RESEND_API_KEY`     | for real email     | If unset, emails are logged + cached   |
| `AUTH_EMAIL_FROM`    | optional           | Sender address. Defaults to `onboarding@resend.dev` |
| `E2E_TEST_MODE`      | Playwright only    | Blocks Resend sends; enables `/api/test/last-magic-link` (manual/debug) |
| `DEV_TEST_AUTH`      | local dev + E2E    | Enables `/dev/login` instant sign-in (`dev@test.local`) — **never in production** |
| `DEV_TEST_USER_EMAIL`| optional           | Dev/E2E user email. Defaults to `dev@test.local` |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Login vs Registration

Better Auth's magic-link plugin accepts `name`, but uses it only when the link
creates a new user. The app mirrors that behavior:

- **Login** sends only `email`, `callbackURL`, and `metadata.intent=sign-in`.
- **Registration** requires `name`, sends `newUserCallbackURL`, and sets
  `metadata.intent=sign-up`.
- `lib/auth-intent.ts` blocks login-mode magic links for unknown emails, so a
  first-time user must use registration and cannot accidentally create an
  unnamed account. The lookup lowercases the email, because Better Auth stores
  emails lowercased but passes the raw input to `sendMagicLink`.
- The server also rejects `intent=sign-up` without a non-blank `name`. The
  intent comes from the client, so a hand-made request must not be able to
  create a nameless account either.
- `/dev/login` (dev/E2E only) registers with `intent=sign-up`, so it works on
  a fresh database where the dev user does not exist yet.

Known trade-off: login mode answers differently for registered and unknown
emails, so it reveals whether an email has an account. That is the price of
the "login never creates users" rule.

When a verified link redirects to `/?welcome=1`, the home page broadcasts an
auth-change event through `localStorage`. Other tabs refresh their session UI,
close stale sign-in panels, and show the signed-in state.

## Pages & routes

| Path                              | What it does                                          |
| --------------------------------- | ----------------------------------------------------- |
| `/`                               | Quote home; slide-in auth panel; welcome banner after verify |
| `/sign-in`                        | Redirects to `/?signIn=1` (opens sign-in panel on home) |
| `/bookmarks`                      | Redirects to home with account/bookmarks panel open (or `/?signIn=1` when logged out) |
| `/q/[id]`                         | Shareable quote permalink with OG image               |
| `/top`                            | Public leaderboard; voting opens auth when needed      |
| `/me`                             | Redirects to `/` (legacy URL)                         |
| `/api/auth/[...all]`              | Better Auth catch-all (sign-in, verify, sign-out, etc.) |
| `/api/bookmarks`                  | List / toggle bookmarks (auth required)               |
| `/api/votes`                      | Up/down-vote quotes (auth required)                   |
| `/api/test/last-magic-link?email=…` | Returns the most recent in-memory magic link. **Only enabled when `E2E_TEST_MODE=true`** and not in Vercel Production |

## E2E flow (Playwright)

Playwright **does not** exercise the magic-link UI or send Resend emails. The
`playwright.config.ts` webServer sets `DEV_TEST_AUTH=true`, `E2E_TEST_MODE=true`,
and clears `RESEND_API_KEY`. Tests call `/dev/login` via `e2e/helpers/auth.ts`:

1. `GET /dev/login` creates a session for `dev@test.local` (magic link stored
   in memory only; email skipped via `shouldSkipMagicLinkEmail`).
2. Redirect to `/?welcome=1` — home page with account panel.
3. `e2e/auth.spec.ts` opens the panel, asserts email, signs out.

For manual magic-link debugging, `/api/test/last-magic-link?email=…` remains
available when `E2E_TEST_MODE=true` (not used by automated E2E).

Optional: `e2e/helpers/mailtm.ts` can poll a real temp inbox when testing full
email delivery outside CI.

## Run E2E locally

```bash
npm run test:e2e
```

Playwright spawns a dedicated dev server on port `3100` with `DEV_TEST_AUTH=true`
(see `playwright.config.ts`). Stop any other `next dev` in the same repo first
(Next.js allows only one dev instance per directory).

## Production checklist

- [x] `BETTER_AUTH_SECRET` set in Vercel (production + preview + dev).
- [x] `BETTER_AUTH_URL` set to `https://pelevin-like.app`.
- [x] `RESEND_API_KEY` set in Vercel (production + dev).
- [x] `AUTH_EMAIL_FROM=noreply@pelevin-like.app` set in Vercel.
- [x] `pelevin-like.app` verified as a sending domain on Resend
      (Frankfurt region, apex verification — SPF / DKIM / MX records live in
      Vercel DNS). Magic links now deliver to any inbox.
- [ ] `E2E_TEST_MODE` **must remain unset** in production.

Defence in depth: `/dev/login` and `/api/test/last-magic-link` also check
`VERCEL_ENV === "production"` in the route file itself and return 404 there,
even if a test flag is set by mistake. Magic links are kept in the in-memory
store only in dev/e2e test mode, never in Production
(`shouldCaptureMagicLink` in `lib/dev-test-auth.ts`).
