# PostgreSQL cutover — 28 October 2026

The local application now uses the `mangesh` PostgreSQL database on the Contabo VPS through the existing `db.curio.gallery:5432` endpoint. The dedicated `mangesh_app` role has application data permissions and is not a PostgreSQL superuser. The application validates the endpoint's TLS certificate. Credentials are stored in the ignored local environment files; they must be configured separately for any other deployment.

The original MySQL database was not deleted. Its previous connection variables and backend are preserved in an ignored local pre-cutover backup under `scratch/mysql-backup/`. Historical migration utilities and scripts are archived under `scratch/mysql-retired-2026-10-28/`; the active application has no MySQL connection configuration.

## Data and verification

The 27 application tables were copied from a consistent MySQL snapshot using an SSH tunnel. MySQL's `__drizzle_migrations` ledger was not copied because it records MySQL migrations. Before cutover, row counts and values were compared across all 27 application tables. The reports contain counts and matching status, not customer data: `artifacts/postgres-migration/copy-counts.json` and `artifacts/postgres-migration/verification.json`.

The database also contains an isolated `mangesh_qa` schema with synthetic test records. The scripts `scripts/verify-postgres-customer-flows.ts` and `scripts/verify-postgres-admin-otp.ts` explicitly use that schema. They must never be changed to point at `public` for testing.

The copy and comparison establish consistency at the time of verification; any other running application still connected to MySQL can write new records there. Configure or stop other instances before relying on PostgreSQL as the sole source of truth, and reconcile any subsequent MySQL writes before switching those instances. After PostgreSQL receives new writes, do not switch back to MySQL without reconciling data created on PostgreSQL.

## Schema migration tooling

The historical files in `scratch/mysql-retired-2026-10-28/` are MySQL-specific. They are not PostgreSQL migrations. `drizzle.config.ts` points PostgreSQL migration generation at `src/server/db/pg-migrations`, but a Drizzle baseline for the already-created PostgreSQL schema has not been established. Do not run `drizzle-kit push` or apply an initial generated migration against the populated database until its baseline has been reconciled against the live schema, indexes and check constraints. Schema administration requires a separate suitably privileged `POSTGRES_MIGRATION_URL`; the runtime role has no schema creation privilege on `public`.

## Checks performed

- 257 automated tests passed; TypeScript and a production build succeeded.
- The isolated PostgreSQL QA schema passed 26 customer flow checks and 7 admin/OTP checks.
- The local catalogue endpoint returned 21 active products and 9 categories from PostgreSQL; the homepage returned HTTP 200.
