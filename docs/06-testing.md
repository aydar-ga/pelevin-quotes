# Testing

## TDD is the default

This repo treats unit tests as a hard requirement, not a nice-to-have:

1. Before you change behaviour, add or update a failing test under `tests/`.
2. Implement the change until that test (and every other) passes.
3. Commit. The Husky pre-commit hook re-runs `lint-staged → tsc → vitest` and
   will block a red suite.

Don't bypass the hook with `--no-verify`. If a change is genuinely untestable
(e.g. visual-only tweak verified in a browser), note *why* in the commit
message.

## Stack

- **[Vitest](https://vitest.dev)** as the runner (Vite-native, instant).
- **[@testing-library/react](https://testing-library.com)** for component tests.
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro)** for realistic interactions.
- **jsdom** as the browser environment.

## Layout

```
tests/
  setup.ts                 # jest-dom matchers
  QuoteCard.test.tsx
  ErrorBanner.test.tsx
```

Tests live in `tests/` (not co-located) so the production bundle never
accidentally pulls them in.

## Running

```bash
npm test                  # one-shot
npm run test:watch        # TDD loop
npm run test:coverage     # v8 coverage → ./coverage/index.html
```

## What we test

- **Components** — render output, ARIA roles, event callbacks. Example:
  clicking the `ErrorBanner` retry button calls `onRetry`.
- **Pure helpers** in `lib/` — e.g. `lib/bookmarks.ts` toggle logic (mocked DB).
- **Keyboard shortcut** — Space on the home page triggers a quote fetch.

## What we don't unit-test

- **API routes** — thin Drizzle wrappers; covered by Playwright in `e2e/api.spec.ts`
  (public quote endpoints, bookmarks auth, session API).
- **Full browser flow** — dev-login auth in `e2e/auth.spec.ts`; both run in CI.

## E2E (Playwright)

```bash
npm run test:e2e
```

Requires `DATABASE_URL` in `.env.local` (or env). Playwright spawns `next dev` on
port `3100` with `DEV_TEST_AUTH=true`, `E2E_TEST_MODE=true`, and `RESEND_API_KEY`
cleared — tests sign in via `/dev/login` (`dev@test.local`). **No magic-link UI,
no Resend emails.**

| Spec | Covers |
| ---- | -------- |
| `e2e/api.spec.ts` | `/api/randomQuote`, `/api/allQuotes`, `/api/quotes/[id]`, `/api/bookmarks`, `/api/auth/get-session` |
| `e2e/auth.spec.ts` | Dev login → account panel → sign-out |

CI runs a single **test** job (lint → types → Vitest → Playwright API E2E), then
**production build** — needs `DATABASE_URL` secret for the E2E steps.

## Writing a new test

```tsx
// tests/MyComponent.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MyComponent from "@/components/MyComponent";

describe("MyComponent", () => {
  it("does the thing", () => {
    render(<MyComponent />);
    expect(screen.getByRole("button")).toBeEnabled();
  });
});
```

The `@/` alias resolves to the repo root via `vitest.config.ts`.

## Precommit

`npm test -- --reporter=dot` runs in the Husky `pre-commit` hook. Keep tests
fast (< 5 s total) or the hook becomes a tax.
