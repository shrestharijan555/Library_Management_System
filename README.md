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
| `npm test` | Run comprehensive QA test suite (`scripts/qa-verify.ts`) |
| `npm run build` | Build Next.js optimized production bundle |
| `npm run start` | Start Next.js production server |
| `npm run lint` | Run ESLint quality checks |
| `npm run db:generate` | Generate SQL migrations from Drizzle schemas |
| `npm run db:migrate` | Apply SQL migrations to the database |
| `npm run db:push` | Push schema changes directly to PostgreSQL |
| `npm run db:studio` | Launch Drizzle Studio database GUI |
| `npm run db:seed` | Seed demo accounts, books, copies, and policies |

---

## Production Deployment Guide

### 1. Supabase Project Setup
1. Create a PostgreSQL project on [Supabase](https://supabase.com).
2. Under **Database Settings -> Connection Pooling**, copy the **Transaction Pooler** connection string (Port `6543`) for `DATABASE_URL`.
3. Under **Authentication -> URL Configuration**:
   - Set **Site URL** to your production domain (e.g. `https://your-library.vercel.app` or `https://edulibrary.example.com`).
   - Add **Redirect URLs**:
     - `https://your-library.vercel.app/auth/callback`
     - `https://your-library.vercel.app/reset-password`
     - `http://localhost:3000/auth/callback` (for local development)

### 2. Environment Variables Configuration
Set the following environment variables in your hosting provider (e.g. Vercel, Netlify, Railway, Docker):

| Variable | Scope | Description |
|---|---|---|
| `DATABASE_URL` | Server-only | PostgreSQL / Supabase Transaction Pooler URI |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Supabase Anonymous Client Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase Service Role Key (Admin/Seeding) |
| `NEXT_PUBLIC_APP_URL` | Public / Client | Base application domain URL |

### 3. Build & Deployment Verification
Run the verification pipeline prior to shipping:
```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

---

## Architecture & System Capabilities

- **Authentication & Security**: Supabase SSR Auth with cookie session management and server-side profile resolution. Automatic rejection of inactive or suspended users.
- **Role-Based Access Control (RBAC)**: Strict 4-tier role hierarchy (`admin`, `librarian`, `staff`, `student`) with server-enforced permissions on all server actions.
- **Circulation & Desk Workflows**: Barcode and ID-based issue, check-in returns, policy renewals, lost declaration with fee assessments, and reservation queue compaction.
- **Financials & Fines**: Integer-cent overdue calculations with customizable grace periods, daily rates, and maximum fee caps ($50.00). Payments and staff waivers with audit logging.
- **Institutional Analytics**: Real-time KPI reporting, multi-domain tabbed analytics, date range filters (`Today`, `7 Days`, `30 Days`, `This Month`, `All Time`), and 5 CSV dataset exports.
- **Universal Audit Trail**: Transactional audit logging for all authentication, member, catalogue, copy, loan, fine, and system setting operations with an administrative inspector console.
