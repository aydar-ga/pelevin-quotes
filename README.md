## About 📖

A minimalist web app that serves witty quotes from Viktor Pelevin's works. Hit
the button, get a fresh dose. Inspired by the spirit of his books — sharp
satire on the slightly absurd nature of our reality.

## Tech stack 🤖

- **Next.js 16** (App Router) on **Node.js 24**
- **React 19**, **Tailwind CSS v4**, **TypeScript 6**
- **Neon Postgres** (serverless) via Vercel Marketplace
- **Drizzle ORM** for typed queries & migrations
- **Vercel** for hosting & CI/CD
- **GitHub Actions** for lint / type-check / build

## Local development 🛠️

```bash
npm install
vercel link            # link to the Vercel project
vercel env pull .env.local   # download Neon connection string
npm run db:seed        # one-off: seed 300 quotes into Neon
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project scripts

| Script              | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start Next.js dev server               |
| `npm run build`     | Production build                       |
| `npm run lint`      | ESLint (flat config)                   |
| `npm run type-check`| `tsc --noEmit`                         |
| `npm run db:push`   | Push Drizzle schema to Neon            |
| `npm run db:seed`   | Reseed quotes table from `scripts/quotes.json` |

## Roadmap 🏁

- Save favourite punchlines
- User-contributed quotes
- Categories & voting
- UI polish
