import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { readFileSync } from 'node:fs';
import * as schema from './schema';

const url = process.env.POSTGRES_URL;
if (!url) throw new Error('POSTGRES_URL is required');
const caPath = process.env.POSTGRES_CA_FILE;
const globalForDb = globalThis as unknown as { __mmPostgresPool?: Pool };
export const connectionPool = globalForDb.__mmPostgresPool ?? new Pool({
  connectionString: url,
  max: Math.max(1, Number(process.env.DB_CONN_LIMIT) || 5),
  ssl: caPath ? { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true } : { rejectUnauthorized: true },
  options: process.env.POSTGRES_SCHEMA === 'mangesh_qa' ? '-c search_path=mangesh_qa' : undefined,
});
if (!globalForDb.__mmPostgresPool) globalForDb.__mmPostgresPool = connectionPool;
export const db = drizzle(connectionPool, { schema });
export async function checkDatabase(): Promise<boolean> {
  try { await connectionPool.query('SELECT 1'); return true; }
  catch (error) { console.error('Database connection error:', error); return false; }
}
