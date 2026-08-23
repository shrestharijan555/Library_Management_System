# Library Management System

Production-oriented, full-stack web application for school and educational libraries.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, Lucide Icons, Class Variance Authority
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **Database & ORM**: PostgreSQL / Supabase, Drizzle ORM
- **Authentication**: Supabase Auth (@supabase/ssr)
- **Validation**: Zod
- **Code Quality**: ESLint (Next.js Core Web Vitals & TypeScript)

---

## Local Development Requirements

- Node.js 24 (see `.nvmrc`)
- npm (comes with Node.js)

If you use nvm:
```bash
nvm use
```

---

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment configuration:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Configure your Supabase and PostgreSQL connection credentials in `.env.local`.

3. **Database migrations (Drizzle ORM):**
   ```bash
   # Generate migrations from schemas
   npm run db:generate

   # Push schema directly to database (development)
   npm run db:push

   # Open Drizzle Studio visual GUI
   npm run db:studio
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint quality checks |
| `npm run db:generate` | Generate SQL migrations from Drizzle schemas |
| `npm run db:migrate` | Apply SQL migrations to the database |
| `npm run db:push` | Push schema changes directly to PostgreSQL |
| `npm run db:studio` | Launch Drizzle Studio database GUI |

---

## Project Structure

```text
src/
├── app/                  # Next.js App Router (pages, layouts, globals.css)
├── components/           # Reusable UI components
│   └── ui/               # Base design system primitives (button, badge, card, input)
├── config/               # App-wide configurations
│   ├── env.ts            # Zod-validated environment config
│   ├── roles.ts          # Roles, permissions matrix, and role hierarchy
│   └── site.ts           # Site metadata, library policies, and navigation
├── db/                   # Database layer
│   ├── index.ts          # Drizzle client instance (PostgresJS)
│   └── schema/           # Entity schemas (users, books, loans, fines, etc.)
├── lib/                  # Shared utilities & helpers
│   ├── utils.ts          # cn() class merge and formatters
│   └── supabase/         # Browser, server, and middleware Supabase clients
└── types/                # Shared TypeScript models and inferred Drizzle types
```

---

## Development Roadmap

- [x] **Phase 1**: Project Foundation (Next.js 16, React 19, TypeScript, Tailwind CSS v4)
- [x] **Phase 2**: Core Architecture & Database Layer (Drizzle ORM, PostgreSQL Schemas, Supabase Auth setup, RBAC permissions, UI Primitives)
- [ ] **Phase 3**: Authentication & User Management (Supabase Auth login/register, session middleware, profile management)
- [ ] **Phase 4**: Book Catalogue & Inventory (Books, Authors, Categories, ISBN lookups, Physical copy tracking)
- [ ] **Phase 5**: Circulation System (Issue, Return, Renew, Reservations, Loan limits)
- [ ] **Phase 6**: Fines & Overdue Management (Automatic calculation, payments, waiving)
- [ ] **Phase 7**: Dashboards & Analytics (Role-based metrics, reports, audit logs)
- [ ] **Phase 8**: Testing & Production Hardening (Vitest unit tests, Playwright E2E)
