# AI Feature Branch

The AI quote generation work is intentionally parked on a local branch, not
merged into `main` and not pushed.

## Current State

| Field | Value |
| ----- | ----- |
| Branch | `feat/ai-quote-generation` |
| Commit | `9be73ef8117a381a66ff7f8b3f2d126896d21155` |
| Commit date | 2026-06-13 |
| Status | Local only, keep separate from production for now |

The commit message is the detailed continuity note:

```bash
git show 9be73ef
```

## What The Branch Adds

- `components/QuoteModeToggle.tsx` — segmented `Цитаты` / `ИИ` toggle.
- `app/api/generateQuote/route.ts` — force-dynamic AI quote endpoint.
- `lib/ai.ts` — Vercel AI SDK / AI Gateway integration with few-shot examples
  from the real quote corpus.
- Tests for prompt shape, output sanitization, route behavior, toggle behavior,
  and home-page mode switching.
- README / `.env.example` / framework docs updates for AI Gateway wiring.

The feature uses few-shot prompting, not model training or finetuning.

## Keep It Off Main Until

- Product decision: should generated quotes exist in the core experience or a
  separate experiment?
- UX decision: generated quotes need clear AI labeling and should not pollute
  the canonical Pelevin dataset.
- Data decision: accepted generations should go into a separate `ai_quotes`
  table if they are persisted.
- Interaction decision: streaming output and share/bookmark behavior need to be
  designed before shipping.

## Resume Commands

```bash
git checkout feat/ai-quote-generation
git show --stat 9be73ef
```

Return to production work:

```bash
git checkout main
```
