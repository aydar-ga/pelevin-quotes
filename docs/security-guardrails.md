# Security guardrails: sign-in email and writes

Goal: nobody can run up the shared **Resend Free** quota (100/day, 3,000/month,
shared with ArtMuse; bounces and complaints risk suspending both), the **Neon
Free** database or **Vercel Hobby**, through sign-in, sign-out or writes. UX
is sacrificed where needed. Code: `lib/abuse-guard.ts`; tests:
`tests/abuse-guard.test.ts`, `e2e/abuse-guard.spec.ts`.

## Sign-in email (`sendMagicLink` in `lib/auth.ts`)

Checked in this order before Resend is called; any failure stops the send:

| # | Check | Result |
|---|---|---|
| 1 | Honeypot field `website` filled (hidden in `SignInForm`) | silent fake success, nothing counted or sent |
| 2 | Kill switch: `AUTH_EMAIL_ENABLED` is exactly `true` | otherwise **503** |
| 3 | Email trimmed, lowercased, ≤ 254 chars, valid shape | otherwise **400** |
| 4 | Per recipient (HMAC): ≤ 3/hour, ≤ 5/day | **429** |
| 5 | Per IP (HMAC): ≤ 5/hour, ≤ 20/day | **429** |
| 6 | App-wide: ≤ 40/day, ≤ 1,000/month | **429** |

- Counters are **durable**: table `abuse_counters` (migration
  `drizzle/0002_add_abuse_counters.sql`), one atomic upsert per bucket in a
  single statement, so concurrent requests cannot overshoot. Windows are fixed
  UTC hour / day / month.
- Denied attempts still count toward the other buckets (stricter, on purpose).
- **Fail closed**: if the counter query errors, the send is denied (429).
- Keys are HMAC-SHA256 (keyed with `BETTER_AUTH_SECRET`) of the email, IP or
  user id. Logs print bucket names and hash prefixes only.
- Rows older than 35 days are pruned on the first hit of each new window.
- All limits live in `LIMITS` in `lib/abuse-guard.ts`.
- The dev test user (`/dev/login`, never in Production) skips the guard
  because no email is sent.

## Magic links

- Expire after 15 minutes, single use (`allowedAttempts: 1`), stored hashed
  (`storeToken: "hashed"`).
- `GET /api/auth/magic-link/verify` is capped at 20 per IP per 10 minutes
  (durable, fail closed) → **429**.

## Sign-out

`/api/auth/sign-out` is POST-only. Better Auth's origin check rejects a POST
from another origin with **403** (e2e: `sign-out is POST-only and refuses a
cross-site origin`).

## Writes

Votes and bookmarks need a session (401 otherwise) and share a durable cap of
**300 writes per user per day** → **429**. There are no anonymous writes.

## Operating it

- Turn sign-in email off instantly: set `AUTH_EMAIL_ENABLED` to anything but
  `true` in Vercel → Production and redeploy.
- Not covered: the public read API (`/api/randomQuote`) still uses the
  per-instance limiter unless Upstash is configured (see owner actions).
