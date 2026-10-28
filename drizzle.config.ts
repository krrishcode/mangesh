import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './src/server/db/pg-migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_MIGRATION_URL || process.env.POSTGRES_URL || '',
    ssl: 'verify-full',
  },
});
