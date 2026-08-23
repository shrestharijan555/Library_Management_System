# Library Management System

Web application for school and educational libraries. Phase 1 is a runnable Next.js foundation only. Library features (catalogue, members, loans, fines, and so on) are not implemented yet.

## Technology stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- ESLint

Later phases are expected to add PostgreSQL, Supabase, Drizzle ORM, Zod, Vitest, and Playwright. Those packages are not installed yet.

## Local development requirements

- Node.js 24 (see `.nvmrc`)
- npm (comes with Node.js)

If you use nvm:

```bash
nvm use
```

## Installation

```bash
npm install
```

## Running the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see a simple Phase 1 home page.

Other useful commands:

```bash
npm run lint
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` when a later phase needs them. Do not commit `.env` or `.env.local`.

| Variable | When it will be needed |
| --- | --- |
| `DATABASE_URL` | Database / ORM setup |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client and auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client and auth |

Phase 1 does not read these variables.

## Project structure

```text
src/app/          Routes and layouts (App Router)
public/           Static assets (when added)
```

Intended folders for later phases (create when the first real file is added):

```text
src/components/   UI components
src/lib/          Shared application helpers
src/server/       Server-only logic
src/db/           Database schema and queries
src/types/        Shared TypeScript types
src/config/       App configuration
tests/            Automated tests
```

## Development philosophy

- Small phases, approved before implementation
- Minimal dependencies until a phase needs them
- No secrets in git
- No fake library features or placeholder business logic
- Keep the code readable for a beginner working with AI assistance

## Future modules

Authentication, role-based access, dashboard, catalogue (books, authors, categories, publishers, copies), members, issuing and returns, renewals, reservations, overdue tracking, fines, notifications, reports, analytics, audit logs, settings, security controls, and automated tests.
