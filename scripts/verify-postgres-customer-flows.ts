import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config({path: '.env.postgres.local', quiet: true});
assert.ok(process.env.POSTGRES_URL, 'Missing isolated QA credentials');
Object.assign(process.env, { POSTGRES_SCHEMA: 'mangesh_qa', JWT_SECRET: randomBytes(32).toString('hex'), APP_ORIGIN: 'http://localhost:3002', COD_ENABLED: 'true', SMTP_HOST: '', SMTP_FROM: '', GOOGLE_CLIENT_ID: '', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' });
const pgPool = new pg.Pool({connectionString:process.env.POSTGRES_URL, ssl:{rejectUnauthorized:true}, options:'-c search_path=mangesh_qa'});
const check = await pgPool.query('SELECT current_schema() AS schema');
assert.equal(check.rows[0].schema,'mangesh_qa');
const fixture = 'qa-fixture-' + Date.now();
await pgPool.query(`INSERT INTO products (title, slug, sku, price, stock, is_active, color, sizes, in_stock_sizes, delivery_method) VALUES ($1,$2,$3,100,50,true,'QA','["M"]','["M"]','both')`,[fixture,fixture,fixture]);
const { handleApi } = await import('../src/server/http/router');
const { connectionPool } = await import('../src/server/db');
const results: Array<{ name: string; status: string; error?: string }> = [];
let ipCounter = 0;
function client() {
  const cookies = new Map<string, string>();
  return {
    token: '',
    async request(path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}) {
      const response = await handleApi(new Request(`http://localhost:3002/api/account${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json', Origin: 'http://localhost:3002',
          'x-forwarded-for': `127.0.0.${++ipCounter}`,
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...(cookies.size ? { Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') } : {}),
          ...extra,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }), path.slice(1).split('/'));
      for (const value of response.headers.getSetCookie()) {
        const [key, content] = value.split(';')[0].split('='); cookies.set(key, content);
      }
      return { status: response.status, data: await response.json(), headers: response.headers };
    },
  };
}
const member = client(), stranger = client(), guest = client(), otherGuest = client();
const password = 'QA-Only-October-2026!';
const email = `flow-${Date.now()}@example.invalid`;
let memberId = 0, addressId = 0, appointmentId = 0, memberOrderId = 0, guestOrderId = 0;
const product = (await pgPool.query('SELECT * FROM products WHERE is_active=true AND stock > 5 ORDER BY id LIMIT 1')).rows[0];
assert.ok(product, 'Available local fixture product');
const size = JSON.parse(product.in_stock_sizes)[0];
const item = { product_id: product.id, quantity: 1, color: product.color, size };
const address = { label: 'shipping', isDefault: true, fullName: 'QA Test Customer', phone: '+919999999999', line1: 'QA test address, no delivery', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' };
const stock = async () => Number((await pgPool.query('SELECT stock FROM products WHERE id=$1', [product.id])).rows[0].stock);
async function test(name: string, run: () => unknown) {
  try { await run(); results.push({ name, status: 'pass' }); console.log(`PASS ${name}`); }
  catch (error) { const message = error instanceof Error ? error.message : String(error); results.push({ name, status: 'fail', error: message }); console.log(`FAIL ${name}: ${message}`); }
}
const ok = (response: any, status = 200) => { assert.equal(response.status, status, JSON.stringify(response.data)); return response.data.data; };

await test('Anonymous customer data and admin access are rejected', async () => {
  for (const path of ['/users/me', '/orders', '/wishlist', '/appointments', '/users/me/addresses', '/shipping', '/admin/dashboard']) assert.equal((await stranger.request(path)).status, 401);
});
await test('Signup validation rejects invalid email, short password, and empty name', async () => {
  assert.equal((await member.request('/auth/register', 'POST', { email: 'invalid', password: 'short', name: '' })).status, 400);
});
await test('Signup creates customer and immediately usable authenticated session', async () => {
  const data = ok(await member.request('/auth/register', 'POST', { email, password, name: 'QA Test Customer', role: 'admin' }), 201);
  assert.equal(data.user.role, 'customer'); member.token = data.token; memberId = data.user.id;
  assert.equal(ok(await member.request('/auth/me')).user.email, email);
});
await test('Duplicate signup gives actionable conflict', async () => assert.equal((await stranger.request('/auth/register', 'POST', { email, password, name: 'Another Customer' })).status, 409));
await test('Concurrent signup creates one account and returns a conflict to the duplicate', async () => {
  const payload = { email: 'race-' + email, password, name: 'QA Concurrent Customer' };
  const responses = await Promise.all([client().request('/auth/register', 'POST', payload), client().request('/auth/register', 'POST', payload)]);
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
});
await test('Wrong password rejected; case-insensitive email login succeeds', async () => {
  assert.equal((await stranger.request('/auth/login', 'POST', { email, password: 'incorrect' })).status, 401);
  const login = ok(await member.request('/auth/login', 'POST', { email: email.toUpperCase(), password })); member.token = login.token;
});
await test('Customer cannot access admin/payment mutation routes', async () => {
  assert.equal((await member.request('/admin/dashboard')).status, 403);
  assert.equal((await member.request('/payments/record', 'POST', { orderId: 1, amount: 1, status: 'paid' })).status, 403);
});
await test('Profile update persists and invalid phone is rejected', async () => {
  assert.equal(ok(await member.request('/users/me', 'PUT', { name: 'QA Updated Customer', phone: '+919999999999' })).name, 'QA Updated Customer');
  assert.equal(ok(await member.request('/users/me')).phone, '+919999999999');
  assert.equal((await member.request('/users/me', 'PUT', { phone: 'bad-phone' })).status, 400);
});
await test('Measurements can be created, read, updated and cleared', async () => {
  ok(await member.request('/users/me/measurements', 'PUT', { chest: 40, waist: 32, unit: 'inches' }), 201);
  assert.equal(Number(ok(await member.request('/users/me/measurements')).chest), 40);
  ok(await member.request('/users/me/measurements', 'PUT', { chest: null, unit: 'cm' }));
  assert.equal(ok(await member.request('/users/me/measurements')).chest, null);
  assert.equal((await member.request('/users/me/measurements', 'PUT', { chest: -1 })).status, 400);
});
await test('Address create, edit, defaults and customer isolation', async () => {
  addressId = ok(await member.request('/users/me/addresses', 'POST', address), 201).id;
  const second = ok(await member.request('/users/me/addresses', 'POST', { ...address, line1: 'Second QA address, no delivery' }), 201);
  const rows = ok(await member.request('/users/me/addresses'));
  assert.equal(rows.filter((value: any) => value.isDefault).length, 1);
  ok(await member.request(`/users/me/addresses/${addressId}`, 'PUT', { isDefault: true, line2: 'QA suite' }));
  assert.equal(ok(await member.request('/users/me/addresses')).find((value: any) => value.id === addressId).line2, 'QA suite');
  const outsider = ok(await stranger.request('/auth/register', 'POST', { email: 'other-' + email, name: 'QA Other Customer', password }), 201); stranger.token = outsider.token;
  assert.equal((await stranger.request(`/users/me/addresses/${addressId}`, 'PUT', { city: 'Delhi' })).status, 404);
  assert.equal((await stranger.request(`/users/me/addresses/${addressId}`, 'DELETE')).status, 404);
  ok(await member.request(`/users/me/addresses/${second.id}`, 'DELETE'));
});
await test('Wishlist add is idempotent, reads product details and removes', async () => {
  ok(await member.request('/wishlist', 'POST', { productId: product.id }), 201);
  ok(await member.request('/wishlist', 'POST', { productId: product.id }));
  const rows = ok(await member.request('/wishlist')); assert.equal(rows.length, 1); assert.equal(rows[0].product_id, product.id);
  ok(await member.request(`/wishlist/${product.id}`, 'DELETE')); assert.equal(ok(await member.request('/wishlist')).length, 0);
});
await test('Appointments book, reschedule, enforce ownership and cancel', async () => {
  const scheduledAt = new Date(Date.now() + 86400000 * 2).toISOString();
  const data = ok(await member.request('/appointments', 'POST', { location: 'QA studio', occasion: 'QA fitting', scheduledAt, notes: 'Synthetic appointment' }), 201); appointmentId = data.id;
  assert.equal(Math.floor(new Date(data.scheduled_at).getTime() / 1000), Math.floor(new Date(scheduledAt).getTime() / 1000));
  assert.equal(ok(await member.request('/appointments')).length, 1);
  assert.equal((await stranger.request(`/appointments/${appointmentId}/reschedule`, 'PATCH', { scheduledAt })).status, 404);
  ok(await member.request(`/appointments/${appointmentId}/reschedule`, 'PATCH', { scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString() }));
  ok(await member.request(`/appointments/${appointmentId}/cancel`, 'PATCH'));
  assert.equal((await member.request(`/appointments/${appointmentId}`, 'PUT', { notes: 'Late change' })).status, 409);
  assert.equal((await member.request('/appointments', 'POST', { location: 'QA', occasion: 'QA', scheduledAt: '2020-01-01T00:00:00.000Z' })).status, 400);
});
await test('Quote uses server price and validates sizes, quantities and duplicate lines', async () => {
  const quote = ok(await guest.request('/checkout/quote', 'POST', { items: [item], fulfilment: 'home' }));
  assert.equal(quote.paymentMethod, 'cod'); assert.ok(quote.total > 0);
  assert.equal((await guest.request('/checkout/quote', 'POST', { items: [{ ...item, size: 'INVALID' }], fulfilment: 'home' })).status, 409);
  assert.equal((await guest.request('/checkout/quote', 'POST', { items: [{ ...item, quantity: 0 }], fulfilment: 'home' })).status, 400);
  assert.equal((await guest.request('/checkout/quote', 'POST', { items: [item, item], fulfilment: 'home' })).status, 400);
});
await test('COD member checkout persists snapshots/payment, deducts stock once and retries safely', async () => {
  const before = await stock(); const quote = ok(await member.request('/checkout/quote', 'POST', { items: [item], fulfilment: 'home' }));
  const payload = { items: [item], fulfilment: 'home', addressId, paymentMethod: 'cod', expectedTotal: quote.total, requestId: randomUUID() };
  memberOrderId = ok(await member.request('/checkout', 'POST', payload), 201).id;
  assert.equal(await stock(), before - 1);
  assert.equal(ok(await member.request('/checkout', 'POST', payload)).id, memberOrderId);
  assert.equal(await stock(), before - 1);
  assert.equal((await member.request('/checkout', 'POST', { ...payload, fulfilment: 'pickup' })).status, 409);
  const order = ok(await member.request(`/orders/${memberOrderId}`)); assert.equal(order.payment_method, 'cod'); assert.equal(order.payment_status, 'pending'); assert.equal(order.shipping_address.line2, 'QA suite'); assert.equal(order.items[0].size, size);
  assert.equal(ok(await member.request('/orders')).length, 1);
  assert.equal(ok(await member.request(`/payments/order/${memberOrderId}`)).length, 1);
  assert.equal((await stranger.request(`/orders/${memberOrderId}`)).status, 404);
  assert.equal((await stranger.request(`/payments/order/${memberOrderId}`)).status, 404);
});
await test('Checkout rejects online payment methods, stale totals and another user address', async () => {
  const quote = ok(await member.request('/checkout/quote', 'POST', { items: [item], fulfilment: 'home' }));
  const payload = { items: [item], fulfilment: 'home', addressId, paymentMethod: 'cod', expectedTotal: quote.total, requestId: randomUUID() };
  assert.equal((await member.request('/checkout', 'POST', { ...payload, paymentMethod: 'card' })).status, 400);
  assert.equal((await member.request('/checkout', 'POST', { ...payload, expectedTotal: 1 })).status, 409);
  assert.equal((await stranger.request('/checkout', 'POST', payload)).status, 404);
});
await test('Member cancellation restores stock once and cancels pending COD payment', async () => {
  const before = await stock(); ok(await member.request(`/orders/${memberOrderId}/cancel`, 'PATCH'));
  assert.equal(await stock(), before + 1); ok(await member.request(`/orders/${memberOrderId}/cancel`, 'PATCH')); assert.equal(await stock(), before + 1);
  assert.equal(ok(await member.request(`/orders/${memberOrderId}`)).payment_status, 'failed');
});
await test('Guest home COD checkout, receipt isolation and cancellation', async () => {
  ok(await guest.request('/checkout/session', 'POST'));
  const quote = ok(await guest.request('/checkout/quote', 'POST', { items: [item], fulfilment: 'home' })); const before = await stock();
  const payload = { items: [item], fulfilment: 'home', paymentMethod: 'cod', expectedTotal: quote.total, requestId: randomUUID(), contact: { email: 'guest@example.invalid', name: 'QA Guest', phone: '+919999999999' }, shippingAddress: address };
  guestOrderId = ok(await guest.request('/checkout/guest', 'POST', payload), 201).id;
  assert.equal(ok(await guest.request('/checkout/guest', 'POST', payload)).id, guestOrderId); assert.equal(await stock(), before - 1);
  assert.equal(ok(await guest.request(`/checkout/guest/orders/${guestOrderId}`)).guest, true);
  ok(await otherGuest.request('/checkout/session', 'POST'));
  assert.equal((await otherGuest.request(`/checkout/guest/orders/${guestOrderId}`)).status, 404);
  ok(await guest.request(`/checkout/guest/orders/${guestOrderId}/cancel`, 'PATCH')); assert.equal(await stock(), before);
});
await test('Guest pickup order can be claimed into signed-in account', async () => {
  const quote = ok(await guest.request('/checkout/quote', 'POST', { items: [item], fulfilment: 'pickup' }));
  const data = ok(await guest.request('/checkout/guest', 'POST', { items: [item], fulfilment: 'pickup', paymentMethod: 'cod', expectedTotal: quote.total, requestId: randomUUID(), contact: { email: 'guest@example.invalid', name: 'QA Guest', phone: '+919999999999' } }), 201);
  guest.token = member.token; ok(await guest.request(`/checkout/guest/orders/${data.id}/claim`, 'POST'));
  assert.equal(ok(await member.request(`/orders/${data.id}`)).guest, false);
  assert.equal((await guest.request(`/checkout/guest/orders/${data.id}/cancel`, 'PATCH')).status, 404);
  ok(await member.request(`/orders/${data.id}/cancel`, 'PATCH'));
});
await test('Shipping and tracking enforce customer ownership', async () => {
  await pgPool.query("INSERT INTO shipments (order_id, carrier, tracking_number, status) VALUES ($1, 'QA Carrier', 'QA-TRACK-001', 'in_transit')", [memberOrderId]);
  assert.equal(ok(await member.request('/shipping')).length, 1);
  assert.equal(ok(await member.request('/shipping/track/QA-TRACK-001')).orderId, memberOrderId);
  assert.equal((await stranger.request('/shipping/track/QA-TRACK-001')).status, 404);
});
await test('Password change rejects wrong current password and invalidates old sessions', async () => {
  assert.equal((await member.request('/users/me/change-password', 'POST', { currentPassword: 'incorrect', newPassword: password + '2' })).status, 400);
  ok(await member.request('/users/me/change-password', 'POST', { currentPassword: password, newPassword: password + '2' }));
  assert.equal((await member.request('/auth/me')).status, 401);
  assert.equal((await member.request('/auth/login', 'POST', { email, password })).status, 401);
  member.token = ok(await member.request('/auth/login', 'POST', { email, password: password + '2' })).token;
});
await test('Password reset is one use, rejects expired tokens and invalidates sessions', async () => {
  const reset = randomUUID() + randomUUID(); const tokenHash = createHash('sha256').update(reset).digest('hex');
  await pgPool.query('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [memberId, tokenHash, new Date(Date.now() + 3600000)]);
  ok(await member.request('/auth/reset-password', 'POST', { token: reset, password: password + '3' }));
  assert.equal((await member.request('/auth/reset-password', 'POST', { token: reset, password })).status, 400);
  assert.equal((await member.request('/auth/me')).status, 401);
  member.token = ok(await member.request('/auth/login', 'POST', { email, password: password + '3' })).token;
  assert.equal((await member.request('/auth/reset-password', 'POST', { token: 'invalid-token-1234', password })).status, 400);
  const expired = randomUUID() + randomUUID();
  await pgPool.query('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [memberId, createHash('sha256').update(expired).digest('hex'), new Date(Date.now() - 86400000)]);
  assert.equal((await member.request('/auth/reset-password', 'POST', { token: expired, password })).status, 400);
});
await test('Logout revokes the bearer session', async () => { ok(await member.request('/auth/logout', 'POST')); assert.equal((await member.request('/auth/me')).status, 401); });
await test('Immediate sign-in after logout creates a fresh usable session', async () => {
  member.token = ok(await member.request('/auth/login', 'POST', { email, password: password + '3' })).token;
  assert.equal(ok(await member.request('/auth/me')).user.id, memberId);
});
await test('Optional Google/recovery show explicit unavailable states without configuration', async () => {
  assert.equal(ok(await stranger.request('/auth/google/config')).enabled, false);
  assert.equal((await stranger.request('/auth/google', 'POST', { credential: 'x'.repeat(30) })).status, 503);
  assert.equal((await stranger.request('/auth/forgot-password', 'POST', { email })).status, 503);
});
await test('Cross-origin checkout is rejected before database writes', async () => assert.equal((await guest.request('/checkout/guest', 'POST', {}, { Origin: 'https://outside.example.invalid', 'sec-fetch-site': 'cross-site' })).status, 403));

await test('Two buyers competing for the last unit cannot oversell', async () => {
  const sku = 'QA-STOCK-' + Date.now();
  const created = await pgPool.query(`INSERT INTO products (title, slug, sku, price, stock, is_active, color, sizes, in_stock_sizes, delivery_method) VALUES ('QA last-unit fixture', $1, $2, 10, 1, true, 'QA', '["M"]', '["M"]', 'both') RETURNING id`, [sku.toLowerCase(), sku]);
  const id = created.rows[0].id;
  const buyers = [client(), client()];
  await Promise.all(buyers.map(buyer => buyer.request('/checkout/session', 'POST')));
  const responses = await Promise.all(buyers.map(buyer => buyer.request('/checkout/guest', 'POST', { items: [{ product_id: id, quantity: 1, size: 'M', color: 'QA' }], fulfilment: 'pickup', paymentMethod: 'cod', expectedTotal: 1000, requestId: randomUUID(), contact: { email: 'race@example.invalid', name: 'QA Buyer', phone: '+919999999999' } })));
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
  assert.equal((await pgPool.query('SELECT stock FROM products WHERE id=$1', [id])).rows[0].stock, 0);
  const winner = responses.findIndex(response => response.status === 201);
  ok(await buyers[winner].request(`/checkout/guest/orders/${responses[winner].data.data.id}/cancel`, 'PATCH'));
});

await mkdir('scratch', { recursive: true });
await writeFile('artifacts/postgres-migration/qa-backend-results.json', JSON.stringify({ at: new Date().toISOString(), database: 'isolated PostgreSQL QA schema', results }, null, 2));
console.log(`RESULT ${results.filter(result => result.status === 'pass').length}/${results.length} passed`);
await pgPool.end(); await connectionPool.end();
if (results.some(result => result.status === 'fail')) process.exitCode = 1;
