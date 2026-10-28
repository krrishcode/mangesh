import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import pg from 'pg';
import { processOutboxBatch } from '../src/server/lib/email-queue';
import { mailConfigured, mailTransport } from '../src/server/lib/mail';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

if (!process.env.POSTGRES_URL || !mailConfigured()) throw new Error('Configure PostgreSQL and SMTP before starting the email worker');
if (process.env.POSTGRES_SCHEMA && process.env.POSTGRES_SCHEMA !== 'mangesh_qa') throw new Error('Unsupported email schema');
if (process.env.POSTGRES_SCHEMA === 'mangesh_qa' && !process.argv.includes('--allow-qa')) throw new Error('QA delivery is disabled');
const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL, max: 2,
  ssl: { rejectUnauthorized: true, ...(process.env.POSTGRES_CA_FILE ? { ca: readFileSync(process.env.POSTGRES_CA_FILE, 'utf8') } : {}) },
  options: process.env.POSTGRES_SCHEMA === 'mangesh_qa' ? '-c search_path=mangesh_qa' : '-c search_path=public',
});
let stopping = false;
const controller = new AbortController();
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => { stopping = true; controller.abort(); });
try {
  const schema = (await pool.query('SELECT current_schema() AS name')).rows[0].name;
  if (schema !== (process.env.POSTGRES_SCHEMA || 'public')) throw new Error('Unexpected email queue schema');
  const transport = mailTransport();
  try { await transport.verify(); }
  catch { throw new Error('SMTP startup verification failed'); }
  finally { transport.close(); }
  console.log(`Email worker ready: schema=${schema}; SMTP verified.`);
  do {
    try {
      const outcomes = await processOutboxBatch(pool);
      for (const result of outcomes) console.log(`Email ${result.id}: ${result.status}`);
      if (process.argv.includes('--once')) break;
    } catch { console.error('Email worker could not process the queue; it will retry.'); }
    if (!stopping) await setTimeout(15000, undefined, { signal: controller.signal }).catch(() => {});
  } while (!stopping);
} finally { await pool.end(); }
