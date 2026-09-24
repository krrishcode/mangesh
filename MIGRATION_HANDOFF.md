# Migration Handoff

Status: complete

The frontend migration from Astro 5 + React islands to Next.js App Router +
React 19 + Tailwind CSS v4 + Zustand is complete. The existing UI/UX and
backend contract were preserved.

## Start locally

Terminal 1:

```text
cd hono
npm install
npm run dev
```

Terminal 2:

```text
cd frontend
npm install
npm run dev
```

Frontend configuration uses `NEXT_PUBLIC_API_URL` from `frontend/.env`.
`frontend/.env.example` contains the local default.

## Production check

```text
cd frontend
npm ci
npm run typecheck
npm run build
npm run start
```

Backend tests:

```text
cd hono
npm ci
npm test
```

## Rollback reference

The pre-migration source backup is preserved at:

`E:\projects\Mangesh Mahadev-migration-baseline-20260922-1649`

It contains the original Astro source and backend snapshot. It intentionally
excludes dependency directories, generated build output, and `.env` files.
Keep the current workspace intact while comparing or restoring files from the
backup.

## Verified acceptance checks

- Next.js build generated 49 routes, including `/celebrities`.
- Frontend typecheck passed.
- Hono test suite passed: 16/16 tests.
- Frontend and backend production dependency audits reported zero
  vulnerabilities.
- Storefront, product, collection, account, authentication, cart, and admin
  routes returned HTTP 200 in production smoke tests.
- Hono health and product API requests returned HTTP 200.
- CORS preflight from the frontend origin passed.
- Active frontend source/configuration contains no Astro runtime references.
