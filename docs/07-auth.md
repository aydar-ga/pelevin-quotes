# Authentication

Magic-link sign-in only — no passwords, no OAuth (yet).

## Library

**[Better Auth](https://www.better-auth.com)** (MIT, TypeScript-first), with
its built-in **Drizzle adapter** and **Magic Link plugin**.

Why magic link only (for v1):

- Implicit email verification — clicking the link proves inbox ownership.
- One field UX. No passwords to store, hash, leak, reset, or strength-rule.
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
| `E2E_TEST_MODE`      | tests only         | Enables `/api/test/last-magic-link`    |
| `E2E_TEST_USER_EMAIL`| E2E only           | Fixed inbox for magic-link pickup. Defaults to `aydarcyber@gmail.com` |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Pages & routes

| Path                              | What it does                                          |
| --------------------------------- | ----------------------------------------------------- |
| `/`                               | Quote home; slide-in sign-in panel; welcome banner after verify |
| `/sign-in`                        | Redirects to `/?signIn=1` (opens sign-in panel on home) |
| `/bookmarks`                      | Redirects to home with account/bookmarks panel open (or `/?signIn=1` when logged out) |
| `/q/[id]`                         | Shareable quote permalink with OG image               |
| `/me`                             | Redirects to `/` (legacy URL)                         |
| `/api/auth/[...all]`              | Better Auth catch-all (sign-in, verify, sign-out, etc.) |
| `/api/bookmarks`                  | List / toggle bookmarks (auth required)               |
| `/api/test/last-magic-link?email=…` | Returns the most recent in-memory magic link. **Only enabled when `E2E_TEST_MODE=true`** |

## E2E flow (`e2e/auth.spec.ts`)

1. Playwright uses a fixed test user (`E2E_TEST_USER_EMAIL`, default
   `aydarcyber@gmail.com`) — the same address allowed by the Resend sandbox.
2. Test navigates to `/sign-in` (redirects to `/?signIn=1`) and fills the panel form.
3. Server's `sendMagicLink` callback fires:
   - If `RESEND_API_KEY` is set, an email is sent to mail.tm.
   - Always, the URL + token are stored in the in-process cache.
4. Test polls `/api/test/last-magic-link?email=…` until the URL appears.
5. Test navigates to the URL → Better Auth verifies → redirected to `/?welcome=1`.
6. Test opens the account panel, asserts the email, clicks **Выйти**,
   and confirms the sign-in button returns on `/`.

The same flow can be extended to poll a real temp inbox via
`e2e/helpers/mailtm.ts` when testing full email delivery end-to-end.

## Run E2E locally

```bash
npm run test:e2e
```

Playwright spawns a dedicated dev server on port `3100` with `E2E_TEST_MODE=true`
(see `playwright.config.ts`). Existing `next dev` on port 3000 is reused if
running.

## Production checklist

- [x] `BETTER_AUTH_SECRET` set in Vercel (production + preview + dev).
- [x] `BETTER_AUTH_URL` set to `https://pelevin-like.app`.
- [x] `RESEND_API_KEY` set in Vercel (production + dev).
- [x] `AUTH_EMAIL_FROM=noreply@pelevin-like.app` set in Vercel.
- [x] `pelevin-like.app` verified as a sending domain on Resend
      (Frankfurt region, apex verification — SPF / DKIM / MX records live in
      Vercel DNS). Magic links now deliver to any inbox.
- [ ] `E2E_TEST_MODE` **must remain unset** in production.
