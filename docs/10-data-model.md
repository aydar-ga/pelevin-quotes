# Data Model & Visual Maps

This is the canonical visual map for persisted data, runtime data flow, and
module relationships. Keep it in sync with `lib/schema.ts`, route contracts,
and any feature that changes saved state.

## Current Decision

`main` now includes one new app-owned table: `quote_votes`, added by
`drizzle/0001_add_quote_votes.sql`. OAuth/passkeys are intentionally skipped
for now. AI generation and community submissions remain off `main`.

| Request | Current DB support | Notes |
| ------- | ------------------ | ----- |
| Signup asks for name once | `user.name text not null` | The UI sends `name` only in registration mode. Login stays email-only. |
| Login must not create unnamed users | `user.email` is unique and `user.name` is required | `lib/auth-intent.ts` blocks sign-in magic links for unknown emails. |
| Flat bookmarks list | `bookmarks` joins `user` to `quotes` | Book grouping is a UI choice and should not be encoded in the DB. |
| Bookmark count updates immediately | `bookmarks` is the source of truth | Client events revalidate the count; no denormalized counter column. |
| Sharing works from quote cards and bookmarks | `quotes.id` is stable | `/q/[id]` is the permalink; no share table is needed. |
| Cross-tab auth and bookmark sync | Browser event/localStorage bridge | This is client state synchronization, not persisted state. |
| Public quote ranking | `quote_votes` joins `user` to `quotes` | One vote per user/quote; value is checked to `-1` or `1`. |
| Random quote rate limiting | Upstash REST or memory bucket | No Postgres table; production can set Upstash env vars. |
| AI quote showcase remains off `main` | No AI tables on `main` | Future generated quotes should use a separate table before merging. |

## Live Database Audit

Last read-only check: 2026-06-16 against the configured Neon database from
`.env.local`.

| Check | Result |
| ----- | ------ |
| `user.name` | `text not null` - signup names are persisted. |
| `user.email` | Unique index `user_email_unique` exists. |
| `bookmarks.user_id` | `text not null`, FK to `user.id`, `ON DELETE CASCADE`. |
| `bookmarks.quote_id` | `integer not null`, FK to `quotes.id`, `ON DELETE CASCADE`. |
| `bookmarks_user_quote_idx` | Unique btree index on `(user_id, quote_id)` exists. |
| Share permalinks | Backed by `quotes.id`, the quote primary key. |
| `quote_votes` | `0001_add_quote_votes.sql` applied; FKs cascade to `user` / `quotes`, `value` is checked to `-1` or `1`, and unique `(user_id, quote_id)` exists. |

## Entity Relationship Diagram

```mermaid
erDiagram
  AUTH_USER ||--o{ SESSION : owns
  AUTH_USER ||--o{ ACCOUNT : owns
  AUTH_USER ||--o{ BOOKMARKS : saves
  AUTH_USER ||--o{ QUOTE_VOTES : casts
  QUOTES ||--o{ BOOKMARKS : saved_as
  QUOTES ||--o{ QUOTE_VOTES : ranked_by
  VERIFICATION {
    text id PK
    text identifier
    text value
    timestamp expires_at
    timestamp created_at
    timestamp updated_at
  }
  AUTH_USER {
    text id PK
    text name "required"
    text email "unique"
    boolean email_verified
    text image
    timestamp created_at
    timestamp updated_at
  }
  SESSION {
    text id PK
    timestamp expires_at
    text token "unique"
    timestamp created_at
    timestamp updated_at
    text ip_address
    text user_agent
    text user_id FK
  }
  ACCOUNT {
    text id PK
    text account_id
    text provider_id
    text user_id FK
    text access_token
    text refresh_token
    text id_token
    timestamp access_token_expires_at
    timestamp refresh_token_expires_at
    text scope
    text password
    timestamp created_at
    timestamp updated_at
  }
  QUOTES {
    serial id PK
    text text
    varchar book
    varchar author
    varchar language
    varchar category
    integer length
  }
  BOOKMARKS {
    serial id PK
    text user_id FK
    integer quote_id FK
    timestamp created_at
  }
  QUOTE_VOTES {
    serial id PK
    text user_id FK
    integer quote_id FK
    integer value "-1 or 1"
    timestamp created_at
    timestamp updated_at
  }
```

## Table Contracts

| Table | Owner | Contract |
| ----- | ----- | -------- |
| `quotes` | App | Canonical quote dataset seeded from `scripts/quotes.json`. Do not mix AI-generated content into this table. |
| `user` | Better Auth + app signup policy | Account profile. `name` is required because registration collects it once. |
| `session` | Better Auth | Active browser sessions. Deletes cascade from `user`. |
| `account` | Better Auth | Auth provider account records. Deletes cascade from `user`. |
| `verification` | Better Auth | Magic-link tokens and verification state. |
| `bookmarks` | App | User-saved quotes. `(user_id, quote_id)` is unique; deletes cascade from both parent tables. |
| `quote_votes` | App | Public ranking votes. `(user_id, quote_id)` is unique; `value` is checked to `-1` or `1`; deletes cascade from both parent tables. |

## Runtime Module Map

```mermaid
classDiagram
  class SignInForm {
    mode_sign_in_or_sign_up
    email
    name
    submitMagicLink()
  }
  class AuthIntentGuard {
    assertMagicLinkIntentAllowed(email, metadata)
  }
  class BetterAuth {
    sendVerificationEmail()
    getSession()
  }
  class AuthStatus {
    session
    bookmarkCount
    refreshOnAuthOrBookmarkChange()
  }
  class QuoteCard {
    quote
    isBookmarked
  }
  class QuoteActions {
    toggleBookmark()
    vote()
    shareQuote()
  }
  class VoteButtons {
    upvote()
    downvote()
    openSignInForGuests()
  }
  class ShareQuoteButton {
    nativeShare()
    copyFallback()
    permalinkFallback()
  }
  class AccountPanel {
    flatBookmarks
    removeBookmark()
  }
  class BookmarksApi {
    GET()
    POST()
  }
  class VotesApi {
    POST()
  }
  class QuotesApi {
    randomQuote()
    quoteById()
    allQuotes()
  }
  class RateLimit {
    checkUpstashOrMemory()
    emitHeaders()
  }
  class DrizzleSchema {
    quotes
    user
    session
    account
    verification
    bookmarks
    quoteVotes
  }

  SignInForm --> AuthIntentGuard
  AuthIntentGuard --> BetterAuth
  AuthStatus --> BetterAuth
  QuoteCard --> QuoteActions
  QuoteActions --> VoteButtons
  QuoteActions --> ShareQuoteButton
  QuoteActions --> BookmarksApi
  VoteButtons --> VotesApi
  AccountPanel --> BookmarksApi
  BookmarksApi --> DrizzleSchema
  VotesApi --> DrizzleSchema
  QuotesApi --> RateLimit
  QuotesApi --> DrizzleSchema
```

## Signup And Login Flow

```mermaid
sequenceDiagram
  actor Guest
  participant Form as SignInForm
  participant Guard as auth-intent
  participant Auth as Better Auth
  participant DB as Neon Postgres
  participant Mail as Resend/log fallback

  Guest->>Form: Choose "Войти" or "Зарегаться"
  Form->>Guard: email + intent metadata
  alt Sign up
    Guard-->>Auth: allow unknown email
    Auth->>DB: create user(name, email) after magic link verification
  else Sign in
    Guard->>DB: check existing user.email
    Guard-->>Auth: allow only if user exists
  end
  Auth->>Mail: send magic link
  Guest->>Auth: open link
  Auth->>DB: create session
  Auth-->>Form: redirect /?welcome=1
```

## Bookmark Flow

```mermaid
sequenceDiagram
  actor User
  participant UI as QuoteActions / AccountPanel
  participant API as /api/bookmarks
  participant DB as bookmarks
  participant Events as app-events
  participant Header as AuthStatus

  User->>UI: Heart quote
  UI->>API: POST quoteId
  API->>DB: insert or delete bookmark
  DB-->>API: current total
  API-->>UI: bookmarked + total
  UI->>Events: publishBookmarkChange(total)
  Events-->>Header: refresh badge immediately
```

## Share Flow

```mermaid
flowchart TD
  A[User clicks share] --> B{Web Share API available}
  B -->|yes| C[Share title, quote text, /q/id]
  B -->|no| D{Clipboard available}
  D -->|yes| E[Copy quote, source, permalink]
  D -->|no| F[Open /q/id in a new tab]
  C --> G[No DB write]
  E --> G
  F --> G
```

## Vote And Ranking Flow

```mermaid
sequenceDiagram
  actor User
  participant UI as VoteButtons
  participant API as /api/votes
  participant DB as quote_votes
  participant Top as /top

  User->>UI: Up/down vote
  UI->>API: POST quoteId + value
  API->>DB: insert, update, or delete same-value vote
  DB-->>API: aggregate score/up/down/userVote
  API-->>UI: updated summary
  Top->>DB: aggregate weekly or all-time leaders
```

## Random Quote Rate Limit Flow

```mermaid
flowchart TD
  A[/api/randomQuote] --> B{Upstash env vars set}
  B -->|yes| C[Upstash REST pipeline: INCR + EXPIRE]
  B -->|no| D[In-memory bucket]
  C --> E{Allowed}
  D --> E
  E -->|yes| F[Fetch random quote]
  E -->|no| G[Return 429 + Retry-After]
```

## Planned AI Extension

The local branch `feat/ai-quote-generation` is intentionally not merged into
`main`. If generated quotes ship, add a separate table instead of storing them
inside `quotes`.

```mermaid
erDiagram
  AUTH_USER ||--o{ AI_QUOTES : requests
  AI_QUOTES {
    text id PK
    text user_id FK
    text prompt
    text generated_text
    text model
    text provider
    integer tokens_in
    integer tokens_out
    timestamp created_at
  }
```

Recommended invariants for that future table:

- Generated rows are clearly AI-authored in UI and Open Graph metadata.
- Canonical `quotes` remains human-curated source material only.
- Store model/provider and token counts for cost/debug visibility.
- Add rate limiting before making generation public.

## Planned Community Extension

The next feature candidate is community submissions plus a source-guessing game.
See [`docs/11-community-game.md`](./11-community-game.md) for the product spec.
The core data boundary is the same as AI generation: community submissions and
guessing state must live outside canonical `quotes`.

## Schema Change Checklist

1. Edit `lib/schema.ts`.
2. Generate a migration with `npm run db:generate`.
3. Review the generated SQL under `drizzle/`.
4. Add or update tests for every changed route/helper/component contract.
5. Update this document, `docs/03-database.md`, and README/doc indexes.
6. Run `npm run lint && npm run type-check && npm test && npm run build`.
7. Apply with `npm run db:migrate`; never use `db:push` on production.
