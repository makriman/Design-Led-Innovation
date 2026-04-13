# Inspire

Play-based learning, ready in seconds.

Inspire is a Next.js app for primary school teachers in Sub-Saharan Africa. Teachers can generate 3 practical classroom games, run them, log quick reflections, and get simple coaching insights over time.

## Stack

- Next.js 15 (App Router + TypeScript)
- Tailwind CSS + shadcn-style UI components
- SQLite (`better-sqlite3`) at `./data/inspire.db`
- Auth via JWT (`jsonwebtoken`) + bcrypt + `httpOnly` cookie
- Anthropic Messages API (`claude-sonnet-4-5`)
- Zod validation
- lucide-react icons

## Features

- Signup/login/logout with secure cookie sessions
- Protected teacher routes (`/dashboard`, `/generate`, `/history`, `/reflect`, `/insights`)
- Lesson generation with 3 constrained, resource-aware games
- Lesson caching in SQLite for offline-tolerant reopen
- Regenerate a single game from results screen
- Reflection logging (3-question flow)
- Insights generation and caching based on reflection count
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
JWT_SECRET=change-me-to-a-long-random-string
```

4. Run the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Database

Database file: `./data/inspire.db`

Tables are initialized automatically on server boot in `lib/db.ts` using `CREATE TABLE IF NOT EXISTS`.

## API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/generate`
- `POST /api/generate/regenerate`
- `GET /api/lessons`
- `GET /api/lessons/[id]`
- `POST /api/reflections`
- `GET /api/reflections`
- `POST /api/insights`

Protected routes validate JWT from the `inspire_token` cookie and return `401` on invalid/missing auth.

## Project Structure

```
app/
  api/
  dashboard/
  generate/[id]/
  history/
  insights/
  login/
  reflect/[lessonId]/[gameIndex]/
  signup/
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

- If `ANTHROPIC_API_KEY` or `JWT_SECRET` is missing, app startup fails loudly.
- Only Anthropic is required externally; all data is local in SQLite.
