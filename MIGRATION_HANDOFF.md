# Migration handoff

Status (22 October 2026): the separate Hono backend has been removed. The
storefront, account/admin UI, API and database access now run in a single
Next.js application at the repository root. UI/UX, public routes and the
`/api/account/*` contract were preserved.

## Start locally

```text
npm install
npm run dev
```

Open http://localhost:3000. There is no second server. Configure `.env.local`
from `.env.example`; `APP_ORIGIN` should be `http://localhost:3000` locally.

## Database

Run migrations from the repository root:

```text
npm run db:migrate
```

Existing installations can use the idempotent additive scripts
`db:migrate:buyer`, `db:migrate:guest` and `db:migrate:products`. Create an
administrator only when needed with the explicit `ADMIN_*` values:

```text
npm run admin:create
```

## Verification

```text
npm run typecheck
npm test
npm run build
npm run start
```

Current results:

- 140 tests pass.
- Typecheck and production build pass.
- Production build succeeds without a reachable database.
- Storefront, product, cart, guest checkout quote, invalid-login handling,
  account redirect and admin gate were exercised in a browser with the backend
  fully removed. No order was created.
- The live database was not modified during verification.

## Deployment status

No Vercel deployment has been made. The owner requested keeping the app on
localhost for now. Phase 8 deployment is deferred until a separate staging
database and Vercel authentication are available. Do not deploy a public
preview against the live database.

Intended deployment: Vercel project with the repository root as its root
directory, MySQL reachable from the function region, migrations run outside the
build, Vercel Blob for uploads, optional Upstash/SMTP/Google configuration, and
Deployment Protection for previews.

## Rollback reference

- Git history on `refactor/nextjs-fullstack` and `main` still contains the
  removed Hono application and the pre-consolidation state.
- The external pre-Astro-migration source backup remains at
  `E:\projects\Mangesh Mahadev-migration-baseline-20260922-1649`.
- No database schema changes were introduced by the consolidation; the existing
  migrations and tables are unchanged.

## Historical records

- `MIGRATION_BASELINE.md` documents the original Astro-to-Next.js migration and
  the Hono-era validation log.
- `docs/` contains the buyer workflow audit, the resulting fixes, and the guest
  checkout/Google setup notes. Paths under `hono/` in those files are historical;
  the current code is under `src/server/`.
