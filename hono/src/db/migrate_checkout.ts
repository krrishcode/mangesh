import { readFile } from 'fs/promises';
import { connectionPool } from './index.js';
// Idempotent, additive migration for an existing installation. No customer rows
// are edited, removed or seeded by this command.
try {
  const source = await readFile(new URL('./migrations/0003_buyer_checkout.sql', import.meta.url), 'utf8');
  for (const statement of source.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean)) {
    if (!/^CREATE TABLE IF NOT EXISTS (order_checkout_details|order_item_variants|revoked_sessions)\s*\(/.test(statement)) throw new Error('Unexpected migration statement');
    await connectionPool.query(statement);
  }
  console.log('Buyer checkout and session tables are ready.');
} finally { await connectionPool.end(); }
