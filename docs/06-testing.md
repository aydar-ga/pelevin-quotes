# Testing

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
- **Pure helpers** in `lib/` (none yet — add them as the surface grows).

## What we don't (yet) test

- **API routes** — they're thin wrappers around Drizzle. When they grow logic
  (auth checks, validation), mock the `db` import via `vi.mock("@/lib/db")`.
- **Full browser flow** — planned as Playwright E2E in CI (see roadmap).

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
