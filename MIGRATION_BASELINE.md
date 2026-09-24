# Astro to Next.js Migration Baseline

Captured: 2026-09-22

## Scope

- Frontend: `frontend/`
- Backend: `hono/` (not modified by Phase 1)
- Migration target: Next.js App Router + React 19 + Tailwind CSS v4 + Zustand

## Runtime

- Node.js: `v26.7.0`
- npm: `11.6.4`
- Git metadata: not available in this workspace

## Current frontend stack

- Astro: `^5.0.0`
- `@astrojs/react`: `^4.2.1`
- React / React DOM: `^19.0.0`
- Tailwind CSS: `^4.0.0`
- `@tailwindcss/vite`: `^4.0.0`
- Zustand: `^5.0.15`

## Route/build baseline

- Astro source page files: `18`
- Generated HTML pages: `157`
- Frontend build command: `npm run build`
- Frontend build result: passed

The generated pages include public storefront, product, collection, auth,
account, and admin routes. Product pages currently use local catalog fallback
data when the backend is unavailable during the static build.

## Backend baseline

- Test command: `npm test` from `hono/`
- Test files: `2 passed`
- Tests: `16 passed`
- Backend source and database files: unchanged

## Visual/browser baseline

- Homepage desktop render: verified at the local Astro dev server
- Product detail desktop render: verified at `/products/101`
- Browser console errors/warnings: none observed
- Existing server-side issue observed: `/favicon.svg` returns `404`; this is
  retained as a pre-migration issue and is not being changed in Phase 1
- Mobile viewport capture: deferred because the connected browser did not
  expose a viewport override; it remains part of post-migration validation

## Safety checkpoint

A source/config backup was created outside the workspace:

`E:\projects\Mangesh Mahadev-migration-baseline-20260922-1649`

The backup excludes generated dependency/build directories and excludes both
`.env` files. No source file was changed during the baseline capture.

## Phase 1 status

Complete. The baseline is preserved above.

## Phase 2 status

Complete. The Next.js foundation is now installed and buildable.

- Next.js: `16.3.5`
- React / React DOM: `19.3.0`
- Tailwind CSS / `@tailwindcss/postcss`: `4.3.3`
- PostCSS: `8.5.28`
- Zustand: `5.0.15`
- TypeScript: `5.9.3`
- Next App Router shell: `frontend/src/app/layout.tsx` and `frontend/src/app/page.tsx`
- Next config: `frontend/next.config.ts`
- Next agent-rule auto-generation: disabled with `agentRules: false`
- Tailwind PostCSS config: `frontend/postcss.config.mjs`
- TypeScript config: migrated from Astro config to Next-compatible config
- Package scripts: `next dev`, `next build`, `next start`, and `typecheck`
- Astro packages: removed from the frontend dependency graph

Validation:

- `npm run typecheck`: passed
- `npm run build`: passed with Next.js/Turbopack

The pre-existing TypeScript mismatches in the Astro-era React components were
resolved with compatibility-only type updates for legacy field aliases and
string/number product IDs. No rendered markup or styling was changed.

The existing Astro routes and components remain in place for the controlled
Phase 3 route/component migration. The temporary Next root page is only a
foundation shell and does not represent the final storefront UI.

## Phase 3 status

Complete. The primary storefront, product, collection, account, authentication,
cart, and admin routes now render through the Next.js App Router while retaining
the existing React components, class names, content, and Tailwind styling.

- Converted the presentational Astro components in `frontend/src/components/`
  to TSX server components.
- Added client boundaries to the existing interactive React islands.
- Added the shared catalog loader at `frontend/src/lib/catalog.ts`, preserving
  the local catalog fallback and backend catalog merge behavior.
- Added static product and collection route generation plus route metadata.
- Added account, authentication, cart, and admin App Router entry points.
- Kept the original `.astro` source files temporarily for controlled cleanup in
  the final migration phase.

Validation:

- `npm run typecheck`: passed
- `npm run build`: passed; 48 Next.js routes generated
- Runtime smoke checks via `http://127.0.0.1:3000`: homepage, shop, product,
  collection, account, admin, and login routes returned HTTP 200
- Next.js homepage accessibility tree loaded with the expected navigation,
  hero, product, editorial, appointment, and footer content
- React list-key warnings found during the smoke run were corrected without
  changing the rendered UI

## Phase 4 status

Complete. The frontend no longer contains Astro source/configuration or
Astro-specific runtime references.

- Removed the legacy Astro route files from `frontend/src/pages/`.
- Removed the legacy Astro layouts from `frontend/src/layouts/`.
- Removed the legacy `.astro` component copies from `frontend/src/components/`.
- Removed `frontend/astro.config.mjs`.
- Removed the stale Astro cache/output directories `frontend/.astro/` and
  `frontend/dist/`.
- Migrated remaining `import.meta.env.PUBLIC_API_URL` usages to
  `process.env.NEXT_PUBLIC_API_URL`.
- Kept the Next.js App Router, React components, Tailwind v4 styles, Zustand
  stores, and backend untouched apart from the necessary frontend env rename.

Final validation:

- `npm run typecheck`: passed
- `npm run build`: passed; 48 Next.js routes generated
- `npm test` from `hono/`: passed; 2 files and 16 tests
- Production server smoke checks: `/`, `/shop`, `/products/101`,
  `/collections/sherwanis`, `/account`, `/admin`, `/login`, and `/cart` all
  returned HTTP 200
- No Astro references remain in active frontend source/configuration

## Phase 5 status

Complete. Final migration hardening and acceptance QA passed without changing
the UI/UX implementation.

- Renamed the local frontend environment key from `PUBLIC_API_URL` to
  `NEXT_PUBLIC_API_URL` and removed the obsolete Astro `ImportMetaEnv` typing.
- Verified the original Astro route surface maps to the Next.js App Router
  routes, including the admin catch-all and dynamic product/collection routes.
- Verified the production homepage accessibility tree contains the expected
  header, hero, collection, editorial, product, appointment, and footer
  sections.
- Verified the requested core packages against the npm registry: Next.js
  `16.3.5`, React `19.3.0`, Tailwind CSS `4.3.3`, and Zustand `5.0.15` are
  current.

Final acceptance validation:

- `npm run typecheck`: passed
- `npm run build`: passed; 48 routes generated
- `npm test` from `hono/`: passed; 16/16 tests
- Production Next.js server: representative storefront, account, admin, auth,
  cart, collection, and product routes returned HTTP 200
- Active frontend source/configuration: no Astro references remain

## Phase 6 status

Complete. Deployment and handoff documentation now matches the migrated
workspace.

- Replaced the stale Astro/pnpm README with the actual Next.js + Hono setup,
  development, production, and testing commands.
- Added `frontend/.env.example` with the required `NEXT_PUBLIC_API_URL` key.
- Documented the current dependency versions and the migration record link.
- Verified both frontend and backend lockfiles with `npm ci --dry-run
  --ignore-scripts`.

Handoff validation:

- Frontend `npm run typecheck`: passed
- Frontend `npm run build`: passed; 48 routes generated
- Backend `npm test`: passed; 16/16 tests

## Phase 7 status

Complete. Release-readiness audit passed.

- Frontend production dependency audit: `0 vulnerabilities`.
- Backend production dependency audit: `0 vulnerabilities`.
- Active frontend source/configuration scan: no Astro, Nanostores, old
  `PUBLIC_API_URL`, or Astro Vite references found.
- Production browser checks confirmed the homepage, login, and admin entry
  points expose the expected interactive controls and navigation.
- Production HTTP smoke matrix passed for storefront, product, collection,
  account, admin, authentication, and cart routes; all returned HTTP 200.

## Phase 8 status

Complete. The repository is frozen in a clean handoff state.

- Added `.next/` and `*.tsbuildinfo` to the repository ignore rules so Next.js
  build output and TypeScript caches are not treated as source artifacts.
- Re-ran frontend `npm ci --dry-run --ignore-scripts` successfully.
- Re-ran frontend typecheck/build, backend tests, and the frontend production
  dependency audit successfully.

Final status: the requested Astro + React islands + Tailwind v4 + Zustand
frontend has been migrated to Next.js App Router + React 19 + Tailwind v4 +
Zustand, with UI/UX preserved and the migration documentation complete.

## Phase 9 status

Complete. Final deployment rehearsal and frontend-backend integration checks
passed.

- Hono development server started successfully on port `4000`.
- Backend health endpoint returned HTTP 200 with the database connected.
- `GET /api/products` returned HTTP 200 with catalog data.
- CORS preflight for the Next.js origin returned HTTP 204 with the configured
  allow-origin response.
- Frontend and backend processes were stopped cleanly after validation.

The migrated workspace is ready for deployment using the documented frontend
and backend start commands.

## Phase 10 status

Complete. Final rollback-ready handoff has been created in
`MIGRATION_HANDOFF.md`.

- Confirmed the external pre-migration backup exists and remains available.
- Confirmed no frontend or backend development servers are left running by the
  migration validation.
- Documented local startup, production verification, rollback reference, and
  acceptance checks for the next maintainer.

The migration is now fully signed off.

## Celebrity archive page

Added the new `/celebrities` editorial page after migration sign-off.

- Reused the existing celebrity look data and project typography/color system.
- Added a responsive zig-zag editorial layout with alternating image/text
  placement for each celebrity.
- Linked the homepage `EXPLORE NOW` CTA to `/celebrities`.
- Added atelier consultation CTA at the end of the page.
- The page is statically generated as the 49th Next.js route.
- Frontend typecheck and production build passed.

## Astro removal completion

Complete. The current workspace contains no Astro source files, Astro config,
Astro dependency, Astro runtime reference, or Astro-specific ignore rule.

- `npm ls astro @astrojs/react @tailwindcss/vite`: empty dependency tree
- `npm prune --ignore-scripts`: passed
- Active frontend source/config scan: no Astro references
- Frontend typecheck/build: passed; 48 routes generated
- Backend tests: passed; 16/16 tests

Historical migration references in this report and the rollback handoff are
documentation only. The external baseline backup remains intentionally
preserved for rollback and is not part of the current application runtime.
