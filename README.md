# Mangesh Mahadev

Full-stack menswear storefront for Mangesh Mahadev. Everything runs in one
Next.js application at the repository root: storefront, account and admin UI,
API route handlers, authentication, checkout, and MySQL access. There is no
separate backend process.

## Stack

- Next.js 16 App Router + React 19
- Tailwind CSS v4
- Zustand stores for the local shopping bag and bearer session
- MySQL + Drizzle ORM
- JWT bearer sessions, scrypt password hashing, guest order cookies
- Cash-on-delivery checkout with server-side stock locking
- Vercel Blob direct uploads for admin product images
- Optional Upstash rate limiting, SMTP password recovery, Google sign-in

## Structure

```text
src/
  app/                     Routes, metadata, and API route handlers
  components/              Storefront components
  react/                   Admin, auth, and account client components
  stores/                  Zustand stores
  lib/                     Pure client/shared helpers
  server/                  DB, API dispatcher, domain modules and server libs
  styles/                  Tailwind v4 and global styles
public/                    Local images and videos
scripts/                   Image optimization helper
docs/                      Historical audit, fix and setup records
drizzle.config.ts          Drizzle Kit configuration
.env.example               Environment template
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MySQL 8 (or compatible)

## Local setup

```bash
npm install
```

Create `.env.local` from `.env.example` and set at least:

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=            # at least 32 characters in production
APP_ORIGIN=http://localhost:3000
```

Apply the database schema:

```bash
npm run db:migrate
```

For an existing database created before the buyer/guest changes, the
idempotent scripts are also available:

```bash
npm run db:migrate:buyer
npm run db:migrate:guest
npm run db:migrate:products
```

Create an administrator explicitly (no default account is seeded). Set
`ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in the environment first:

```bash
npm run admin:create
```

## Development

```bash
npm run dev
```

Open http://localhost:3000. The API is served by the same Next.js process at
`/api/*`; do not start a second server.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm run start
```

The suite currently contains 140 tests. Production builds do not query the
database: catalog pages are explicitly dynamic, so migrations and data are not
needed at build time.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DB_*` | MySQL connection (`DB_CONN_LIMIT` defaults to 5) |
| `JWT_SECRET` | HS256 session signing; required in production |
| `APP_ORIGIN` | Public site origin used for origin checks and recovery links |
| `COD_ENABLED` | Set to `false` to disable cash-on-delivery checkout |
| `SHIPPING_FEE_INR` | Home delivery fee in rupees |
| `SMTP_*` | Password recovery email; unset means recovery returns 503 |
| `GOOGLE_CLIENT_ID` | Enables Google sign-in; unset hides the provider |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads; unset means admin uploads return 503 |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Shared rate limiting; unset uses the per-instance fallback |

Admin uploads accept up to 6 images per selection, JPG/PNG/WebP, 8 MB each.
Uploads go directly from the browser to Vercel Blob.

No SMTP, Google, Blob, Upstash, or payment-gateway credentials are required to
run the storefront locally; only the features that depend on them are disabled.

## Deployment

The app is deployment-ready for Vercel but **has not been deployed**. Intended
setup:

1. Create a Vercel project with the repository root as its root directory.
2. Add the environment variables above as Preview/Production values. Use a
   staging database for previews; do not attach a public preview to live data.
3. Connect a Vercel Blob store if admin uploads are needed.
4. Run migrations from a trusted machine or CI, not from the Vercel build.
5. Ensure the MySQL host accepts connections from Vercel and choose a function
   region close to the database.
6. Set `APP_ORIGIN` to the public origin and enable Deployment Protection for
   previews where appropriate.

See `MIGRATION_HANDOFF.md` for the migration background and current status.
