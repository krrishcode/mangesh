# Mangesh Mahadev

Full-stack menswear storefront for Mangesh Mahadev. Everything runs in one
Next.js application at the repository root: storefront, account and admin UI,
API route handlers, authentication, checkout, and PostgreSQL access. There is no
separate backend process.

## Stack

- Next.js 16 App Router + React 19
- Tailwind CSS v4
- Zustand stores for the local shopping bag and bearer session
- PostgreSQL + Drizzle ORM
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
- PostgreSQL

## Local setup

```bash
npm install
```

Create `.env.local` from `.env.example` and set at least:

```env
POSTGRES_URL=          # PostgreSQL connection URL; use a TLS-protected endpoint
JWT_SECRET=            # at least 32 characters in production
APP_ORIGIN=http://localhost:3000
```

The PostgreSQL database must already have the application schema. The imported
production schema does not yet have a Drizzle PostgreSQL migration baseline;
`db:push` and `db:migrate` are guarded until it is reconciled. See
[PostgreSQL cutover notes](docs/postgresql-cutover-2026-10-28.md).

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

The suite covers authentication, authorization, catalog, cart and checkout
regressions. Production builds do not query the database: catalog pages are
explicitly dynamic, so migrations and data are not needed at build time.

For integration checks, configure `.env.postgres.local` with `POSTGRES_URL`
for a PostgreSQL database containing an isolated `mangesh_qa` schema, then run:

```bash
npm run test:customer-flows
npm run test:admin-otp
```

These scripts use the isolated QA schema and create synthetic test records.
They do not replace browser testing.

## Configuration

| Variable | Purpose |
| --- | --- |
| `POSTGRES_URL` | PostgreSQL connection URL; remote connections use verified TLS |
| `POSTGRES_CA_FILE` | Optional CA certificate for PostgreSQL TLS |
| `DB_CONN_LIMIT` | Maximum database pool connections (defaults to 5) |
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
4. Reconcile the PostgreSQL migration baseline before using schema migration commands; run any future migrations from a trusted machine or CI, not from the Vercel build.
5. Ensure the PostgreSQL host accepts secure connections from Vercel and choose a function
   region close to the database.
6. Set `APP_ORIGIN` to the public origin and enable Deployment Protection for
   previews where appropriate.

See `MIGRATION_HANDOFF.md` for the migration background and current status.

### Customer email OTP

Checkout uses an email-first Login or Signup dialog; customer login/register pages share the same flow. See [email OTP setup and QA](docs/email-otp-checkout.md) for SMTP and the local-only development code override. Terms and Privacy pages are included at `/terms-and-conditions` and `/privacy-policy`.

### Transactional notifications

Hostinger SMTP and the persistent welcome/order/appointment notification worker are configured. See [transactional email setup](docs/email-setup-2026-10-28.md) for the exact enabled scope, worker commands and verification. Run `npm run test:email-notifications` against the isolated QA schema to verify queue behavior without sending real messages.
