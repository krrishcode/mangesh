// The imported PostgreSQL database predates Drizzle's PostgreSQL migration journal.
// Refuse schema changes until the journal and live schema have been reconciled.
console.error('PostgreSQL migration baseline is not established. See docs/postgresql-cutover-2026-10-28.md before changing the schema.');
process.exitCode = 1;
