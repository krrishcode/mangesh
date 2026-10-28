import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';
import pg from 'pg';
import { processOutboxBatch } from '../src/server/lib/email-queue';

config({ path: '.env.postgres.local', quiet: true });
Object.assign(process.env, { NODE_ENV: 'test', APP_ORIGIN: 'http://localhost:3000' });
const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: true }, options: '-c search_path=mangesh_qa' });
const results: string[] = [];
const suffix = randomUUID();
const check = async (name: string, run: () => Promise<void>) => { await run(); results.push(name); console.log(`PASS ${name}`); };
try {
  assert.equal((await pool.query('SELECT current_schema() AS schema')).rows[0].schema, 'mangesh_qa');
  await pool.query('DELETE FROM email_outbox');
  let userId = 0, orderId = 0, appointmentId = 0;
  await check('welcome queues only after committed customer creation', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      userId = (await client.query("INSERT INTO users(email,name,password_hash,role) VALUES ($1,'Email QA','qa-only','customer') RETURNING id", [`email-${suffix}@example.invalid`])).rows[0].id;
      assert.equal(Number((await client.query('SELECT count(*) FROM email_outbox')).rows[0].count), 0);
      await client.query('COMMIT');
      assert.equal(Number((await pool.query("SELECT count(*) FROM email_outbox WHERE kind='welcome'")).rows[0].count), 1);
    } finally { client.release(); }
  });
  await check('rolled-back account creation leaves no notification', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("INSERT INTO users(email,name,password_hash,role) VALUES ($1,'Rollback','qa-only','customer')", [`rollback-${suffix}@example.invalid`]);
      await client.query('ROLLBACK');
      assert.equal(Number((await pool.query('SELECT count(*) FROM email_outbox')).rows[0].count), 1);
    } finally { client.release(); }
  });
  await check('order snapshot includes late line items and creates customer/staff copies', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      orderId = (await client.query("INSERT INTO orders(user_id,total_amount,status) VALUES ($1,100,'pending') RETURNING id", [userId])).rows[0].id;
      const itemId = (await client.query("INSERT INTO order_items(order_id,title,quantity,price) VALUES ($1,'QA Kurta',1,100) RETURNING id", [orderId])).rows[0].id;
      await client.query("INSERT INTO order_item_variants(order_item_id,size,color) VALUES ($1,'M','Ivory')", [itemId]);
      await client.query("INSERT INTO order_checkout_details(order_id,user_id,request_key,request_hash,fulfilment,payment_method,subtotal,shipping_amount) VALUES ($1,$2,$3,$4,'pickup','cod',100,0)", [orderId, userId, randomUUID(), 'qa']);
      await client.query('COMMIT');
      const rows = (await pool.query("SELECT payload FROM email_outbox WHERE kind='order_placed'")).rows;
      assert.equal(rows.length, 2);
      assert.equal(rows.find(r => !r.payload.staff)!.payload.items[0].size, 'M');
      assert.equal(rows.find(r => !r.payload.staff)!.payload.fulfilment, 'pickup');
      // Idempotent order retry does not insert a new order; a status change is out of scope.
      await pool.query("UPDATE orders SET status='processing' WHERE id=$1", [orderId]);
      assert.equal(Number((await pool.query("SELECT count(*) FROM email_outbox WHERE kind='order_placed'")).rows[0].count), 2);
    } finally { client.release(); }
  });
  await check('guest order email reads contact details inserted after the order', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const id = (await client.query("INSERT INTO orders(total_amount,status) VALUES (200,'pending') RETURNING id")).rows[0].id;
      await client.query("INSERT INTO guest_order_details(order_id,session_hash,email,name,phone) VALUES ($1,$2,$3,'Guest QA','+919999999999')", [id, 'test-session', `guest-${suffix}@example.invalid`]);
      await client.query("INSERT INTO order_items(order_id,title,quantity,price) VALUES ($1,'Guest Kurta',1,200)", [id]);
      await client.query("INSERT INTO order_checkout_details(order_id,request_key,request_hash,fulfilment,payment_method,subtotal,shipping_amount) VALUES ($1,$2,'qa','home','cod',200,0)", [id, randomUUID()]);
      await client.query('COMMIT');
      const rows = (await pool.query("SELECT recipient,payload FROM email_outbox WHERE kind='order_placed' AND (payload->>'orderId')::integer=$1", [id])).rows;
      assert.equal(rows.length, 2);
      assert.equal(rows.find(row => !row.payload.staff)!.recipient, `guest-${suffix}@example.invalid`);
    } finally { client.release(); }
  });
  await check('appointment events cover both admin and customer writes without notes-only spam', async () => {
    appointmentId = (await pool.query("INSERT INTO appointments(user_id,location,occasion,scheduled_at) VALUES ($1,'QA Store','Fitting','2026-11-15 10:00:00') RETURNING id", [userId])).rows[0].id;
    await pool.query("UPDATE appointments SET notes='Internal note' WHERE id=$1", [appointmentId]);
    assert.equal(Number((await pool.query("SELECT count(*) FROM email_outbox WHERE kind LIKE 'appointment_%'")).rows[0].count), 2);
    await pool.query("UPDATE appointments SET scheduled_at='2026-11-16 10:00:00' WHERE id=$1", [appointmentId]);
    await pool.query("UPDATE appointments SET status='cancelled' WHERE id=$1", [appointmentId]);
    await pool.query("UPDATE appointments SET status='cancelled' WHERE id=$1", [appointmentId]);
    for (const kind of ['appointment_booked', 'appointment_rescheduled', 'appointment_cancelled']) assert.equal(Number((await pool.query('SELECT count(*) FROM email_outbox WHERE kind=$1', [kind])).rows[0].count), 2);
  });
  await check('simultaneous workers claim disjoint jobs and do not resend completed jobs', async () => {
    const delivered = new Set<string>();
    const sender = async (_to: string, _content: unknown, id?: string) => { assert.ok(id); assert.ok(!delivered.has(id)); delivered.add(id); };
    const batches = await Promise.all([processOutboxBatch(pool, sender, 20), processOutboxBatch(pool, sender, 20)]);
    const total = batches.flat().length;
    assert.equal(delivered.size, total);
    assert.equal(total, 11);
    assert.equal((await processOutboxBatch(pool, sender, 20)).length, 0);
  });
  await check('SMTP failure preserves business records and retries with bounded attempts', async () => {
    await pool.query("INSERT INTO email_outbox(event_key,kind,recipient,payload) VALUES ($1,'welcome','test@example.invalid','{}')", [`retry-${suffix}`]);
    const failed = await processOutboxBatch(pool, async () => { throw Object.assign(new Error('secret provider detail'), { code: 'ECONNECTION' }); });
    assert.equal(failed[0].status, 'failed');
    const row = (await pool.query('SELECT * FROM email_outbox WHERE event_key=$1', [`retry-${suffix}`])).rows[0];
    assert.equal(row.attempts, 1); assert.equal(row.last_error, 'ECONNECTION');
    assert.ok(new Date(row.next_attempt_at).getTime() > Date.now());
    assert.equal(Number((await pool.query('SELECT count(*) FROM orders WHERE id=$1', [orderId])).rows[0].count), 1);
    await pool.query("UPDATE email_outbox SET next_attempt_at=now() WHERE id=$1", [row.id]);
    assert.equal((await processOutboxBatch(pool, async () => {}))[0].status, 'sent');
  });
  await check('duplicate event keys create only one notification', async () => {
    const key = `dedup-${suffix}`;
    for (let i = 0; i < 2; i++) await pool.query("SELECT public.mm_enqueue_email('mangesh_qa',$1,'welcome','test@example.invalid','{}'::jsonb)", [key]);
    assert.equal(Number((await pool.query('SELECT count(*) FROM email_outbox WHERE event_key=$1', [key])).rows[0].count), 1);
    assert.equal((await processOutboxBatch(pool, async () => {})).length, 1);
  });
  await check('exhausted jobs stop retrying and stale leases recover safely', async () => {
    await pool.query("INSERT INTO email_outbox(event_key,kind,recipient,payload,status,attempts) VALUES ($1,'welcome','test@example.invalid','{}','failed',5)", [`exhausted-${suffix}`]);
    await pool.query("INSERT INTO email_outbox(event_key,kind,recipient,payload,status,attempts,locked_at,lock_token) VALUES ($1,'welcome','test@example.invalid','{}','sending',1,now()-interval '11 minutes','old-worker')", [`stale-${suffix}`]);
    await pool.query("INSERT INTO email_outbox(event_key,kind,recipient,payload,status,attempts,locked_at,lock_token) VALUES ($1,'welcome','test@example.invalid','{}','sending',1,now(),'active-worker')", [`active-${suffix}`]);
    const recovered = await processOutboxBatch(pool, async () => {});
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0].status, 'sent');
    assert.equal((await pool.query('SELECT status FROM email_outbox WHERE event_key=$1', [`exhausted-${suffix}`])).rows[0].status, 'failed');
    assert.equal((await pool.query('SELECT status FROM email_outbox WHERE event_key=$1', [`active-${suffix}`])).rows[0].status, 'sending');
    await pool.query('DELETE FROM email_outbox WHERE event_key=$1', [`active-${suffix}`]);
  });
  await mkdir('artifacts/email-setup', { recursive: true });
  await writeFile('artifacts/email-setup/queue-tests.json', JSON.stringify({ at: new Date().toISOString(), results, smtpDelivery: 'injected test sender only; no real messages' }, null, 2));
  console.log(`RESULT ${results.length}/${results.length} passed`);
} finally { await pool.end(); }
