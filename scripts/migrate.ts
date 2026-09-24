import { db } from '../hono/src/db/index.js';

async function migrate() {
  console.log('Running database migrations...');
  // Database migration steps here
  console.log('Migrations complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
