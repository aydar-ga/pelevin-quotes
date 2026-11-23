# Product Voice

The app speaks Russian to users. Code, commits, and docs stay in English.

## Tone

The voice is cool, sharp, informal, and compact. It should feel like a small
tool with taste, not a corporate product explaining itself.

Use:

- Short sentences.
- Direct verbs.
- Slightly ironic phrasing when it helps the moment.
- Concrete UI words: `сердечки`, `цитатка`, `внутри`, `почта`.
- Calm failure copy that tells the user what to do next.

Avoid:

- Formal support language: `уважаемый пользователь`, `произошла ошибка`.
- Marketing filler: `уникальный опыт`, `революционный сервис`.
- Long explanations inside the UI.
- Cute copy that blocks comprehension.
- English in user-facing controls.

## Current Patterns

| Surface | Pattern |
| ------- | ------- |
| Primary quote action | `Давай цитатку` |
| Auth confirmation | `Проверь почту` |
| Post-auth toast | `Ты на месте. Сердечки включены.` |
| Bookmark empty state | `Пока пусто. Сохраняй цитаты сердечком на главной.` |
| Retryable failure | `Не удалось ... Попробуй ещё раз.` |

## Auth Copy

Authentication should stay blunt and low-friction:

- Login mode asks only for email.
- Signup mode asks for name + email.
- Name is required only for first-time signup because Better Auth stores it
  when the magic link creates a user.
- If a login email does not exist, tell the user to switch to registration.

## Email Copy

Email is part of the product surface. Keep it visually aligned with the dark,
minimal app: black background, restrained border, one strong white CTA, short
copy.

The magic-link email should not sound like a generic SaaS template. It should
say what happened, where to click, how long the link lives, and what to do if
the user did not request it.

## Share Copy

The share action is icon-first. The accessible label is `Поделиться цитатой`.
Use the Web Share API when available. Otherwise copy:

```text
"<quote>"
- <book>

https://.../q/<id>
```

When clipboard access is unavailable, open the permalink in a new tab.
