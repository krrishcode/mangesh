# E-commerce Monorepo

E-commerce application with a Next.js storefront, React 19 client
components/islands, Tailwind CSS v4, Zustand, and a Hono backend backed by
MySQL.

## Project structure

```text
frontend/                  # Next.js App Router storefront and admin/user UI
  src/app/                 # Routes, layouts, metadata, and dynamic segments
  src/components/          # Storefront components
  src/react/               # Admin, auth, and account client components
  src/stores/              # Zustand stores
  src/styles/              # Tailwind v4 and global styles
  src/lib/                 # API and catalog helpers
  .env.example             # Frontend environment template

hono/                      # Hono Node/MySQL backend
scripts/                   # Database and seed utilities
MIGRATION_BASELINE.md      # Astro-to-Next migration record and validation log
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MySQL for the backend

## Setup

Install dependencies in each application:

```bash
cd hono
npm install

cd ../frontend
npm install
```

Copy the environment templates and set local values:

```bash
copy .env.example hono\.env
copy frontend\.env.example frontend\.env
```

The frontend API URL is configured with `NEXT_PUBLIC_API_URL`, normally
`http://localhost:4000/api` for local development.

## Development

Run the backend and frontend in separate terminals:

```bash
# Terminal 1
cd hono
npm run dev

# Terminal 2
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Production validation

```bash
cd frontend
npm run typecheck
npm run build
npm run start
```

Run backend tests with:

```bash
cd hono
npm test
```

## Current frontend stack

- Next.js `16.3.5`
- React / React DOM `19.3.0`
- Tailwind CSS `4.3.3`
- Zustand `5.0.15`
- TypeScript `5.9.3`

The frontend is fully migrated from Astro. The migration record, route
coverage, compatibility notes, and validation results are documented in
[`MIGRATION_BASELINE.md`](./MIGRATION_BASELINE.md).

Deployment commands, rollback reference, and final acceptance checks are also
listed in [`MIGRATION_HANDOFF.md`](./MIGRATION_HANDOFF.md).
