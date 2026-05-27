# Inspire

A play-based lesson generation app for primary school teachers in Sub-Saharan Africa.

Live: [https://designledinnovation.vercel.app/](https://designledinnovation.vercel.app/)

## Mission

Teachers should be able to turn constrained classrooms into playful learning environments. Inspire helps generate practical, resource-aware games, capture reflections, and turn repeated use into simple coaching insight.

## What This Repository Contains

Next.js teacher tool with passcode-protected routes, Claude-powered lesson generation, Neon Postgres persistence, reflection logging, insights snapshots, and print-friendly classroom game cards.

## Highlights

- Generate three constrained classroom games from teacher inputs.
- Regenerate individual games and print one A4 page per card.
- Log reflections and view historical lessons.
- Protected dashboard, generate, history, reflect, and insights routes.

## Tech Stack

- Next.js 15 App Router and TypeScript
- Tailwind CSS
- Neon Postgres
- Anthropic Messages API
- JWT session cookie with scrypt passcode hash
- Zod and lucide-react

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Quality Checks

```bash
npm run build
npm run lint
```

## Repository Notes

- Set ANTHROPIC_API_KEY, DATABASE_URL, APP_PASSCODE_HASH, and SESSION_SECRET for full functionality.
- Do not commit real passcodes, database URLs, or model provider keys.

## Contributing

Contributions are welcome. The best contributions are specific, tested, and grounded in the product mission. Good places to help include documentation, accessibility, tests, bug reports, UI polish, data validation, and safer AI behavior.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

Please do not open public issues for secrets, auth bypasses, data exposure, provider key leaks, or abuse vectors. Follow [SECURITY.md](SECURITY.md).

## Code of Conduct

This project follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Be direct, kind, and useful.

## License

MIT. See [LICENSE](LICENSE).
