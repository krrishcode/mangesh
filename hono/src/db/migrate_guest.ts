import { readFile } from 'fs/promises';
import { connectionPool } from './index.js';
// Preserve existing orders and customer records; allow explicit guest ownership.
try {
  const source = await readFile(new URL('./migrations/0004_guest_google.sql', import.meta.url), 'utf8');
  for (const statement of source.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean)) {
    if (!/^(ALTER TABLE (orders|order_checkout_details) MODIFY COLUMN user_id INT NULL;|CREATE TABLE IF NOT EXISTS (guest_sessions|guest_order_details|google_identities)\s*\()/.test(statement)) throw new Error('Unexpected migration statement');
    await connectionPool.query(statement);
  }
  console.log('Guest checkout and Google identity schema ready. Existing records preserved.');
} finally { await connectionPool.end(); }
