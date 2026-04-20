# Inspire

Play-based learning, ready in seconds.

Inspire is a Next.js app for primary school teachers in Sub-Saharan Africa. Teachers can generate 3 practical classroom games, run them, log quick reflections, and get simple coaching insights over time.

## Stack

- Next.js 15 (App Router + TypeScript)
- Tailwind CSS + shadcn-style UI components
- Neon Postgres via `DATABASE_URL` (Vercel Marketplace friendly)
- Single passcode unlock via scrypt hash + JWT session cookie (`httpOnly`, 12h TTL)
- Anthropic Messages API (Sonnet for lesson generation, Haiku for reflection coaching by default)
- Zod validation
- lucide-react icons

## Features

- Single passcode unlock flow (`/unlock`) with secure cookie sessions
- Protected teacher routes (`/dashboard`, `/generate`, `/history`, `/reflect`, `/insights`)
- Lesson generation with 3 constrained, resource-aware games
- Persistent lesson/reflection history in Postgres with infinite-scroll-friendly pagination
- Regenerate a single game from results screen
- Reflection logging (3-question flow)
- Insights snapshots plus deterministic AI response caching and call logging
- Print-friendly game cards (one A4 page per game)
- Mobile-first layout with large controls for 360px screens

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill values:

```bash
cp .env.local.example .env.local
```

3. Set required variables in `.env.local`:

```env
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
ANTHROPIC_FEEDBACK_MODEL=claude-3-5-haiku-latest
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
APP_PASSCODE_HASH=scrypt$your-random-salt$your-derived-hex-hash
SESSION_SECRET=change-me-to-a-long-random-string
```

Generate `APP_PASSCODE_HASH` safely (example for passcode `5243`):

```bash
node -e 'const { randomBytes, scryptSync } = require("node:crypto"); const passcode = "5243"; const salt = randomBytes(16).toString("hex"); const hash = scryptSync(passcode, salt, 32).toString("hex"); console.log(`scrypt$${salt}$${hash}`);'
```

4. Run the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Database

Database: Neon Postgres (`DATABASE_URL`)

Tables are initialized automatically on first query in `lib/db.ts` using idempotent `CREATE TABLE IF NOT EXISTS`.

## API Routes

- `POST /api/unlock`
- `POST /api/unlock/logout`
- `POST /api/generate`
- `POST /api/generate/regenerate`
- `GET /api/lessons`
- `GET /api/lessons/[id]`
- `POST /api/reflections`
- `GET /api/reflections`
- `POST /api/insights`

Protected routes validate the unlock cookie (`inspire_unlock`) and return `401` on invalid/missing auth.

## Project Structure

```
app/
  api/
  dashboard/
  generate/[id]/
  history/
  insights/
  unlock/
  reflect/[lessonId]/[gameIndex]/
components/
  ui/
lib/
  auth.ts
  claude.ts
  db.ts
  env.ts
  schemas.ts
middleware.ts
```

## Notes

- If `ANTHROPIC_API_KEY`, `DATABASE_URL`, `APP_PASSCODE_HASH`, or session secret is missing, startup fails loudly.
- Anthropic + Postgres are the required external services for production.
