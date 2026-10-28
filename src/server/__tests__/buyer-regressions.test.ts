import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const fixture = vi.hoisted(() => ({
  tables: {} as Record<string, any[][]>,
  writes: [] as any[],
  queries: [] as any[],
  affected: 1,
  nextId: 1000,
  transactions: 0,
  rollbacks: 0,
  failTable: '',
  failInsertTable: '',
}));

vi.mock('../db', () => {
  const name = (table: any) => table[Symbol.for('drizzle:Name')];
  function chain(rows: any, table = '') {
    const query: any = {
      then: (resolve: any, reject: any) =>
        fixture.failTable && fixture.failTable === table
          ? Promise.reject(new Error('database fixture offline')).then(resolve, reject)
          : Promise.resolve(rows).then(resolve, reject),
    };
    for (const method of ['limit', 'orderBy', 'for', 'innerJoin', 'leftJoin', 'onConflictDoUpdate', 'groupBy']) {
      query[method] = () => query;
    }
    query.returning = () => query;
    query.where = (condition: any) => {
      if (condition) fixture.queries.push({ table, ...new PgDialect().sqlToQuery(condition) });
      return query;
    };
    return query;
  }
  const db: any = {
    select: () => ({ from: (table: any) => chain(fixture.tables[name(table)]?.shift() || [], name(table)) }),
    insert: (table: any) => ({
      values: (payload: any) => {
        fixture.writes.push({ kind: 'insert', table: name(table), payload });
        if (fixture.failInsertTable === name(table)) return Promise.reject(new Error('Fixture insert failure'));
        return chain([{ id: ++fixture.nextId }], name(table));
      },
    }),
    update: (table: any) => ({
      set: (payload: any) => {
        fixture.writes.push({ kind: 'update', table: name(table), payload });
        return chain(fixture.affected ? [{ id: 1 }] : [], name(table));
      },
    }),
    delete: (table: any) => {
      fixture.writes.push({ kind: 'delete', table: name(table) });
      return chain(fixture.affected ? [{ id: 1 }] : [], name(table));
    },
    transaction: async (callback: any) => {
      fixture.transactions++;
      const start = fixture.writes.length;
      try {
        return await callback(db);
      } catch (error) {
        fixture.rollbacks++;
        fixture.writes.splice(start);
        throw error;
      }
    },
  };
  return { db };
});

vi.mock('../http/auth', async () => {
  const { AppError } = await import('../lib/errors');
  return {
    authenticate: async (request: Request) => {
      const token = request.headers.get('authorization');
      if (!['Bearer customer', 'Bearer admin'].includes(token || '')) {
        throw new AppError(401, 'Unauthorized: missing bearer token');
      }
      return { id: 1, email: 'buyer@example.invalid', role: token === 'Bearer admin' ? 'admin' : 'customer' };
    },
    optionalAuthenticate: async () => null,
  };
});

vi.mock('../lib/mail', () => ({ mailConfigured: vi.fn(() => false), sendPasswordReset: vi.fn(async () => {}) }));
vi.mock('../lib/google-auth', () => ({ googleClientId: () => process.env.GOOGLE_CLIENT_ID || '', verifyGoogleCredential: vi.fn() }));

import { verifyGoogleCredential } from '../lib/google-auth';
import { hashResetToken } from '../lib/auth';
import { mailConfigured, sendPasswordReset } from '../lib/mail';
import { quoteItems, checkoutSchema } from '../lib/checkout';
import { cancelOrder } from '../lib/order-actions';
import { recordManualPayment, changePaymentStatus } from '../lib/payment-actions';
import { handleApi } from '../http/router';
import { resetRateLimits } from '../http/rate-limit';
import { getCatalogProduct, getCatalogProducts } from '../services/catalog';
import type { ProductRecord } from '../db/schema';

const product = {
  id: 44,
  title: 'Fixture kurta',
  sku: 'FIXTURE-44',
  isActive: true,
  price: '100.00',
  salePrice: '80.00',
  stock: 3,
  color: 'Blue',
  sizes: '["M","L"]',
  inStockSizes: '["M","L"]',
  colorVariants: null,
  imageFront: '/fixture.webp',
  deliveryMethod: 'both',
} as ProductRecord;
const items = [{ product_id: 44, color: 'Blue', size: 'M', quantity: 1 }];
const input = {
  items,
  fulfilment: 'home',
  addressId: 11,
  paymentMethod: 'cod',
  expectedTotal: 8000,
  requestId: '123e4567-e89b-42d3-a456-426614174000',
};
const address = {
  id: 11,
  userId: 1,
  label: 'shipping',
  isDefault: true,
  fullName: 'Fixture Buyer',
  phone: '9000000000',
  line1: 'Fixture address',
  line2: '',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
  country: 'India',
};

function request(
  prefix: string,
  path: string,
  method = 'GET',
  body?: unknown,
  token = 'customer',
  extraHeaders: Record<string, string> = {}
) {
  const [pathname, query = ''] = path.split('?');
  const suffix = `${prefix}${pathname}`;
  const url = `http://localhost/api/account/${suffix}${query ? `?${query}` : ''}`;
  return handleApi(
    new Request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...extraHeaders,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    suffix.split('/').filter(Boolean)
  );
}

beforeEach(() => {
  fixture.tables = {};
  fixture.writes = [];
  fixture.queries = [];
  fixture.affected = 1;
  fixture.nextId = 1000;
  fixture.transactions = 0;
  fixture.rollbacks = 0;
  fixture.failTable = '';
  fixture.failInsertTable = '';
  vi.mocked(mailConfigured).mockReturnValue(false);
  vi.mocked(sendPasswordReset).mockClear();
  vi.stubEnv('SHIPPING_FEE_INR', '0');
  vi.stubEnv('COD_ENABLED', 'true');
  vi.stubEnv('GOOGLE_CLIENT_ID', '');
  vi.mocked(verifyGoogleCredential).mockReset();
  resetRateLimits();
});

describe('guest ownership and Google sign-in', () => {
  const raw = 'a'.repeat(64);
  const session = { tokenHash: hashResetToken(raw), expiresAt: new Date(Date.now() + 86400000) };
  const guestInput = {
    ...input,
    contact: { email: 'guest@example.invalid', name: 'Fixture Guest', phone: '9000000000' },
    shippingAddress: address,
  };

  function guestRequest(path: string, method = 'GET', body?: unknown, cookie = `mm_guest=${raw}`, token = '') {
    return request('checkout', path, method, body, token, cookie ? { Cookie: cookie } : {});
  }

  it('stores only a hash of the guest receipt capability and issues an HttpOnly cookie', async () => {
    const response = await guestRequest('/session', 'POST', undefined, '');
    expect(response.status).toBe(200);
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    const secret = cookie.match(/mm_guest=([a-f0-9]+)/)![1];
    expect(fixture.writes[0].payload.tokenHash).toBe(hashResetToken(secret));
    expect(JSON.stringify(await response.json())).not.toContain(secret);
  });

  it('requires a valid browser session for guest placement and receipts', async () => {
    expect((await guestRequest('/guest', 'POST', guestInput, '')).status).toBe(401);
    expect((await guestRequest('/guest/orders/1', 'GET', undefined, '')).status).toBe(401);
    expect(fixture.writes).toHaveLength(0);
  });

  it('rejects invalid contact numbers and addresses longer than database fields before writing', async () => {
    expect((await guestRequest('/guest', 'POST', { ...guestInput, contact: { ...guestInput.contact, phone: 'not-a-phone' } })).status).toBe(400);
    expect((await guestRequest('/guest', 'POST', { ...guestInput, shippingAddress: { ...address, city: 'A'.repeat(129) } })).status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it('places an unregistered COD order without creating or attaching an account', async () => {
    fixture.tables.guest_sessions = [[session], [session]];
    fixture.tables.products = [[product]];
    const response = await guestRequest('/guest', 'POST', guestInput);
    expect(response.status).toBe(201);
    expect(fixture.writes.find((write) => write.table === 'orders').payload.userId).toBeNull();
    expect(fixture.writes.some((write) => write.table === 'users')).toBe(false);
    expect(fixture.writes.find((write) => write.table === 'guest_order_details').payload).toMatchObject({
      email: guestInput.contact.email,
      sessionHash: session.tokenHash,
    });
    expect(fixture.writes.find((write) => write.table === 'payments').payload.status).toBe('pending');
  });

  it('guest retries are idempotent and retain their browser-specific request key', async () => {
    fixture.tables.guest_sessions = [[session], [session]];
    fixture.tables.products = [[product]];
    await guestRequest('/guest', 'POST', guestInput);
    const snapshot = fixture.writes.find((write) => write.table === 'order_checkout_details').payload;
    const count = fixture.writes.length;
    fixture.tables.guest_sessions = [[session], [session]];
    fixture.tables.order_checkout_details = [[snapshot]];
    expect((await guestRequest('/guest', 'POST', guestInput)).status).toBe(200);
    expect(fixture.writes).toHaveLength(count);
  });

  it('never looks up guest receipts by a supplied email or order ID alone', async () => {
    fixture.tables.guest_sessions = [[session]];
    expect((await guestRequest('/guest/orders/44?email=guest@example.invalid')).status).toBe(404);
    const scope = fixture.queries.find((query) => query.table === 'guest_order_details');
    expect(scope.sql).toContain('session_hash');
    expect(scope.params).toContain(session.tokenHash);
    expect(fixture.queries.some((query) => query.table === 'orders')).toBe(false);
  });

  it('requires account authentication and the guest capability to claim an order', async () => {
    expect((await guestRequest('/guest/orders/44/claim', 'POST')).status).toBe(401);
    fixture.tables.guest_sessions = [[session]];
    expect((await guestRequest('/guest/orders/44/claim', 'POST', undefined, `mm_guest=${raw}`, 'customer')).status).toBe(404);
    expect(fixture.writes).toHaveLength(0);
  });

  it('rejects cross-site cookie writes and HTML form submissions', async () => {
    expect((await request('checkout', '/session', 'POST', undefined, '', { Origin: 'https://untrusted.invalid' })).status).toBe(403);
    expect((await request('checkout', '/session', 'POST', undefined, '', { 'Content-Type': 'application/x-www-form-urlencoded' })).status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it('guest cancellation cannot operate on an unrelated or claimed order', async () => {
    fixture.tables.guest_sessions = [[session]];
    fixture.tables.orders = [[{ id: 44, userId: 7, status: 'pending' }]];
    fixture.tables.guest_order_details = [[{ orderId: 44 }]];
    expect((await guestRequest('/guest/orders/44/cancel', 'PATCH')).status).toBe(404);
    expect(fixture.writes).toHaveLength(0);
  });

  it('guest cancellation is limited to pending orders', async () => {
    fixture.tables.guest_sessions = [[session]];
    fixture.tables.orders = [[{ id: 44, userId: null, status: 'processing' }]];
    fixture.tables.guest_order_details = [[{ orderId: 44 }]];
    expect((await guestRequest('/guest/orders/44/cancel', 'PATCH')).status).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it('owned guest cancellation restores stock and fails the pending COD payment atomically', async () => {
    fixture.tables.guest_sessions = [[session]];
    fixture.tables.orders = [[{ id: 44, userId: null, status: 'pending' }]];
    fixture.tables.guest_order_details = [[{ orderId: 44 }]];
    fixture.tables.order_checkout_details = [[{ orderId: 44 }]];
    fixture.tables.order_items = [[{ productId: 44, quantity: 1 }]];
    expect((await guestRequest('/guest/orders/44/cancel', 'PATCH')).status).toBe(200);
    expect(fixture.writes.filter((write) => write.table === 'products')).toHaveLength(1);
    expect(fixture.writes.find((write) => write.table === 'orders').payload.status).toBe('cancelled');
    expect(fixture.writes.find((write) => write.table === 'payments').payload.status).toBe('failed');
  });

  it('claims an owned guest order atomically and refuses orders belonging to another account', async () => {
    fixture.tables.guest_sessions = [[session]];
    fixture.tables.guest_order_details = [[{ orderId: 44, sessionHash: session.tokenHash }]];
    fixture.tables.orders = [[{ id: 44, userId: 9 }]];
    expect((await guestRequest('/guest/orders/44/claim', 'POST', undefined, `mm_guest=${raw}`, 'customer')).status).toBe(404);
    expect(fixture.writes).toHaveLength(0);

    fixture.tables.guest_sessions = [[session]];
    fixture.tables.guest_order_details = [[{ orderId: 44, sessionHash: session.tokenHash }]];
    fixture.tables.orders = [[{ id: 44, userId: null }]];
    expect((await guestRequest('/guest/orders/44/claim', 'POST', undefined, `mm_guest=${raw}`, 'customer')).status).toBe(200);
    expect(fixture.writes.map((write) => write.payload.userId)).toEqual([1, 1]);
  });

  it('does not advertise a working Google provider before it is configured', async () => {
    const response = await request('auth', '/google/config', 'GET', undefined, '');
    expect((await response.json()).data.enabled).toBe(false);
    expect((await request('auth', '/google', 'POST', { credential: 'fake-credential-long-enough' }, '')).status).toBe(503);
  });

  it('rejects Google login without its signed browser nonce before token verification', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'fixture.apps.googleusercontent.com');
    expect((await request('auth', '/google', 'POST', { credential: 'fake-credential-long-enough' }, '')).status).toBe(401);
    expect(verifyGoogleCredential).not.toHaveBeenCalled();
    expect(fixture.writes).toHaveLength(0);
  });

  async function googleLogin(identity: { subject: string; email: string; name: string; authoritative: boolean }) {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'fixture.apps.googleusercontent.com');
    const config = await request('auth', '/google/config', 'GET', undefined, '');
    const cookie = config.headers.get('set-cookie')!.split(';')[0];
    vi.mocked(verifyGoogleCredential).mockResolvedValue(identity);
    return request('auth', '/google', 'POST', { credential: 'fixture-credential-long-enough' }, '', { Cookie: cookie });
  }

  it('does not link a password account using a third-party Google email alias', async () => {
    fixture.tables.users = [[{ id: 1, email: 'buyer@example.invalid', role: 'customer' }]];
    expect((await googleLogin({ subject: 'google-1', email: 'buyer@example.invalid', name: 'Buyer', authoritative: false })).status).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it('never grants Google sign-in access to administrators', async () => {
    fixture.tables.users = [[{ id: 1, email: 'admin@gmail.com', role: 'admin' }]];
    expect((await googleLogin({ subject: 'google-admin', email: 'admin@gmail.com', name: 'Admin', authoritative: true })).status).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it('returns a real local session for a verified, linked Google customer', async () => {
    fixture.tables.google_identities = [[{ subject: 'google-1', userId: 1 }]];
    fixture.tables.users = [[{ id: 1, email: 'buyer@gmail.com', name: 'Buyer', role: 'customer', phone: null, passwordHash: 'google-only:fixture-secret' }]];
    const response = await googleLogin({ subject: 'google-1', email: 'buyer@gmail.com', name: 'Buyer', authoritative: true });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.token).toBeTruthy();
    expect(result.data.user.passwordHash).toBeUndefined();
  });

  it('creates a Google customer and identity atomically without a usable password', async () => {
    fixture.tables.users = [[], [{ id: 1001, email: 'new@gmail.com', name: 'New Buyer', role: 'customer', phone: null, passwordHash: 'google-only:random' }]];
    expect((await googleLogin({ subject: 'google-new', email: 'new@gmail.com', name: 'New Buyer', authoritative: true })).status).toBe(200);
    expect(fixture.transactions).toBe(1);
    expect(fixture.writes.find((write) => write.table === 'users').payload.passwordHash).toMatch(/^google-only:/);
    expect(fixture.writes.find((write) => write.table === 'google_identities').payload.userId).toBe(1001);
  });

  it('rolls back account creation if storing the Google identity fails', async () => {
    fixture.failInsertTable = 'google_identities';
    const response = await googleLogin({ subject: 'google-new', email: 'new@gmail.com', name: 'Buyer', authoritative: true });
    expect(response.status).toBe(500);
    expect(fixture.rollbacks).toBe(1);
    expect(fixture.writes).toHaveLength(0);
  });
});

describe('buyer security regressions', () => {
  for (const [name, prefix, path, method, body] of [
    ['payment write', 'payments', '/record', 'POST', { orderId: 44, amount: 1, status: 'paid' }],
    ['payment read', 'payments', '/order/44', 'GET', undefined],
    ['shipments', 'shipping', '/', 'GET', undefined],
  ] as const) {
    it(`${name} rejects anonymous requests`, async () => {
      expect((await request(prefix, path, method, body, '')).status).toBe(401);
      expect(fixture.writes).toHaveLength(0);
    });
  }

  it('customers cannot record payment statuses', async () => {
    expect((await request('payments', '/record', 'POST', { orderId: 44, amount: -10, status: 'paid' })).status).toBe(403);
    expect(fixture.writes).toHaveLength(0);
  });

  it('payment history scopes the parent order to its owner', async () => {
    expect((await request('payments', '/order/44')).status).toBe(404);
    expect(fixture.queries[0].sql).toContain('user_id');
    expect(fixture.queries[0].params).toContain(1);
  });

  it('shipping is scoped to the current customer', async () => {
    expect((await request('shipping', '/')).status).toBe(200);
    expect(fixture.queries[0].sql).toContain('user_id');
  });

  it('foreign appointment update returns 404 before writing or selecting private details', async () => {
    const response = await request('appointments', '/44', 'PUT', { occasion: 'Fixture' });
    expect(response.status).toBe(404);
    expect(fixture.writes).toHaveLength(0);
    expect(fixture.queries).toHaveLength(1);
    expect(fixture.queries[0].sql).toContain('user_id');
  });

  it('missing appointment cancellation is not a success', async () => {
    fixture.affected = 0;
    expect((await request('appointments', '/44/cancel', 'PATCH')).status).toBe(404);
  });

  it('missing appointment rescheduling is not a success', async () => {
    fixture.affected = 0;
    expect((await request('appointments', '/44/reschedule', 'PATCH', { scheduledAt: new Date(Date.now() + 86400000).toISOString() })).status).toBe(404);
  });

  it('past bookings and reschedules are rejected server-side', async () => {
    expect((await request('appointments', '/', 'POST', { location: 'Mumbai', occasion: 'Fitting', scheduledAt: '2000-01-01T10:00:00Z' })).status).toBe(400);
    expect((await request('appointments', '/44/reschedule', 'PATCH', { scheduledAt: '2000-01-01T10:00:00Z' })).status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it('foreign address update cannot clear the customers default', async () => {
    expect((await request('users', '/me/addresses/99', 'PUT', { isDefault: true, label: 'shipping' })).status).toBe(404);
    expect(fixture.writes).toHaveLength(0);
    expect(fixture.rollbacks).toBe(1);
  });

  it('default address uses the stored label when the patch omits it', async () => {
    fixture.tables.addresses = [[address], [address]];
    expect((await request('users', '/me/addresses/11', 'PUT', { isDefault: true })).status).toBe(200);
    expect(fixture.transactions).toBe(1);
    expect(fixture.writes[0].payload).toEqual({ isDefault: false });
    expect(fixture.writes[1].payload.isDefault).toBe(true);
    expect(fixture.queries.some((query) => query.sql.includes('label') && query.params.includes('shipping'))).toBe(true);
  });

  it('editing a default address preserves the default flag', async () => {
    fixture.tables.addresses = [[address], [{ ...address, city: 'Pune' }]];
    expect((await request('users', '/me/addresses/11', 'PUT', { city: 'Pune' })).status).toBe(200);
    expect(fixture.writes[1].payload.isDefault).toBe(true);
  });

  it('missing address deletion returns 404', async () => {
    fixture.affected = 0;
    expect((await request('users', '/me/addresses/99', 'DELETE')).status).toBe(404);
  });

  it('missing wishlist deletion returns 404', async () => {
    fixture.affected = 0;
    expect((await request('wishlist', '/44', 'DELETE')).status).toBe(404);
  });

  it('inactive product lookup requires the active predicate', async () => {
    fixture.tables.products = [[]];
    expect(await getCatalogProduct('44')).toBeUndefined();
    expect(fixture.queries[0].sql).toContain('is_active');
  });

  it('database outage is not a successful empty catalogue', async () => {
    fixture.failTable = 'products';
    await expect(getCatalogProducts()).rejects.toThrow('The catalogue is temporarily unavailable. Please try again.');
  });

  it('reset recovery never returns secrets when email is not configured', async () => {
    const response = await request('auth', '/forgot-password', 'POST', { email: 'fixture@example.invalid' }, '');
    expect(response.status).toBe(503);
    expect((await response.json()).resetToken).toBeUndefined();
    expect(fixture.writes).toHaveLength(0);
  });

  it('configured recovery sends the secret only through mail', async () => {
    vi.mocked(mailConfigured).mockReturnValue(true);
    fixture.tables.users = [[{ id: 1, email: 'fixture@example.invalid' }]];
    const response = await request('auth', '/forgot-password', 'POST', { email: 'fixture@example.invalid' }, '');
    expect(response.status).toBe(200);
    expect((await response.json()).resetToken).toBeUndefined();
    expect(sendPasswordReset).toHaveBeenCalledOnce();
  });

  it('failed SMTP delivery is never reported as sent', async () => {
    vi.mocked(mailConfigured).mockReturnValue(true);
    vi.mocked(sendPasswordReset).mockRejectedValueOnce(new Error('SMTP unavailable'));
    fixture.tables.users = [[{ id: 1, email: 'fixture@example.invalid' }]];
    expect((await request('auth', '/forgot-password', 'POST', { email: 'fixture@example.invalid' }, '')).status).toBe(503);
  });

  it('password reset changes credentials and consumes every recovery token atomically', async () => {
    fixture.tables.password_reset_tokens = [[{ id: 700, userId: 1, expiresAt: new Date(Date.now() + 60000), usedAt: null }]];
    expect((await request('auth', '/reset-password', 'POST', { token: 'fixture-token-long-enough', password: 'new-fixture-password' }, '')).status).toBe(200);
    expect(fixture.transactions).toBe(1);
    expect(fixture.writes.find((write) => write.table === 'users').payload.passwordHash).toMatch(/^scrypt:/);
    expect(fixture.queries.some((query) => query.table === 'password_reset_tokens' && query.sql.includes('user_id'))).toBe(true);
  });

});

describe('COD checkout and inventory', () => {
  it('uses the server sale price in integer paise', () => {
    expect(quoteItems([product], items, 'home').total).toBe(8000);
  });

  it('rejects zero stock and counts the same product across sizes', () => {
    expect(() => quoteItems([{ ...product, stock: 0 }], items, 'home')).toThrow();
    expect(() => quoteItems([product], [{ ...items[0], quantity: 2 }, { ...items[0], size: 'L', quantity: 2 }], 'home')).toThrow();
  });

  it('rejects inactive products, unavailable variants and duplicate lines', () => {
    expect(() => quoteItems([{ ...product, isActive: false }], items, 'home')).toThrow();
    expect(() => quoteItems([product], [{ ...items[0], size: 'XXL' }], 'home')).toThrow();
    expect(() => quoteItems([product], [...items, ...items], 'home')).toThrow();
  });

  it('does not fabricate stock sizes', () => {
    expect(() => quoteItems([{ ...product, inStockSizes: null }], items, 'home')).toThrow();
  });

  it('rejects non-COD status injection, fractional and negative quantities', () => {
    expect(checkoutSchema.safeParse({ ...input, paymentMethod: 'paid' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...input, items: [{ ...items[0], quantity: -1 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...input, items: [{ ...items[0], quantity: 1.5 }] }).success).toBe(false);
  });

  it('does not allow checkout against an unavailable fulfilment method', () => {
    expect(() => quoteItems([{ ...product, deliveryMethod: 'pickup' }], items, 'home')).toThrow();
  });

  it('requires authentication for order placement', async () => {
    expect((await request('checkout', '/', 'POST', input, '')).status).toBe(401);
  });

  it('creates a COD order with address and size snapshots and pending payment', async () => {
    fixture.tables.addresses = [[address]];
    fixture.tables.products = [[product]];
    const response = await request('checkout', '/', 'POST', { ...input, amount: 1, status: 'paid' });
    expect(response.status).toBe(201);
    expect(fixture.transactions).toBe(1);
    expect(fixture.writes.find((write) => write.table === 'orders').payload.totalAmount).toBe('80.00');
    expect(fixture.writes.find((write) => write.table === 'payments').payload).toMatchObject({ provider: 'COD', status: 'pending', amount: '80.00' });
    expect(fixture.writes.find((write) => write.table === 'order_item_variants').payload).toMatchObject({ size: 'M', color: 'Blue' });
    expect(JSON.parse(fixture.writes.find((write) => write.table === 'order_checkout_details').payload.shippingAddress).line1).toBe(address.line1);
  });

  it('brings an archived customer back to the current admin list when they place a new order', async () => {
    fixture.tables.addresses = [[address]];
    fixture.tables.products = [[product]];
    fixture.tables.admin_record_archives = [[{ entityType: 'customers', entityId: 1 }]];
    expect((await request('checkout', '/', 'POST', input)).status).toBe(201);
    expect(fixture.writes.some(write => write.kind === 'delete' && write.table === 'admin_record_archives')).toBe(true);
    expect(fixture.writes.find(write => write.table === 'audit_logs').payload).toMatchObject({ action: 'customer.activity_restore', entityId: 1 });
    expect(fixture.writes.find(write => write.table === 'orders').payload.userId).toBe(1);
  });

  it('restores an archived customer when they book a new appointment', async () => {
    const scheduledAt = new Date(Date.now() + 86400000);
    fixture.tables.appointments = [[{ id: 1001, location: 'Mumbai', occasion: 'Fitting', scheduledAt, status: 'upcoming' }]];
    fixture.tables.admin_record_archives = [[{ entityType: 'customers', entityId: 1 }]];
    expect((await request('appointments', '/', 'POST', { location: 'Mumbai', occasion: 'Fitting', scheduledAt: scheduledAt.toISOString() })).status).toBe(201);
    expect(fixture.transactions).toBe(1);
    expect(fixture.writes.some(write => write.kind === 'delete' && write.table === 'admin_record_archives')).toBe(true);
    expect(fixture.writes.find(write => write.table === 'audit_logs').payload.action).toBe('customer.activity_restore');
  });

  it('a retry returns the original order without deducting stock twice', async () => {
    fixture.tables.addresses = [[address]];
    fixture.tables.products = [[product]];
    const response = await request('checkout', '/', 'POST', input);
    const first = (await response.json()).data;
    const details = fixture.writes.find((write) => write.table === 'order_checkout_details').payload;
    const count = fixture.writes.length;
    fixture.tables.order_checkout_details = [[details]];
    const repeat = await request('checkout', '/', 'POST', input);
    expect(repeat.status).toBe(200);
    expect((await repeat.json()).data.id).toBe(first.id);
    expect(fixture.writes).toHaveLength(count);
  });

  it('a reused request ID with different contents is rejected', async () => {
    fixture.tables.addresses = [[address]];
    fixture.tables.products = [[product]];
    await request('checkout', '/', 'POST', input);
    fixture.tables.order_checkout_details = [[fixture.writes.find((write) => write.table === 'order_checkout_details').payload]];
    expect((await request('checkout', '/', 'POST', { ...input, fulfilment: 'pickup' })).status).toBe(409);
  });

  it('rejects a foreign address before creating orders or reducing stock', async () => {
    expect((await request('checkout', '/', 'POST', input)).status).toBe(404);
    expect(fixture.writes).toHaveLength(0);
  });

  it('requires renewed confirmation when the total changed', async () => {
    fixture.tables.addresses = [[address]];
    fixture.tables.products = [[product]];
    expect((await request('checkout', '/', 'POST', { ...input, expectedTotal: 1 })).status).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it('rolls back when the guarded stock deduction fails', async () => {
    fixture.tables.addresses = [[address]];
    fixture.tables.products = [[product]];
    fixture.affected = 0;
    expect((await request('checkout', '/', 'POST', input)).status).toBe(409);
    expect(fixture.rollbacks).toBe(1);
    expect(fixture.writes).toHaveLength(0);
  });

  it('cancellation restores aggregate stock once', async () => {
    fixture.tables.orders = [[{ id: 5, userId: 1, status: 'pending' }]];
    fixture.tables.order_checkout_details = [[{ orderId: 5 }]];
    fixture.tables.order_items = [[{ productId: 44, quantity: 1 }, { productId: 44, quantity: 2 }]];
    await cancelOrder(5, 1);
    expect(fixture.writes.filter((write) => write.table === 'products')).toHaveLength(1);
    const count = fixture.writes.length;
    fixture.tables.orders = [[{ id: 5, userId: 1, status: 'cancelled' }]];
    await cancelOrder(5, 1);
    expect(fixture.writes).toHaveLength(count);
  });

  it('customers cannot cancel shipped orders', async () => {
    fixture.tables.orders = [[{ id: 5, userId: 1, status: 'shipped' }]];
    expect((await request('orders', '/5/cancel', 'PATCH')).status).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it('cash collection cannot reopen a cancelled order', async () => {
    fixture.tables.orders = [[{ id: 5, status: 'cancelled', totalAmount: '80.00' }]];
    await expect(recordManualPayment({ orderId: 5, provider: 'COD', amount: 80, status: 'paid' })).rejects.toMatchObject({ status: 409 });
    expect(fixture.writes).toHaveLength(0);
  });

  it('COD collection updates the existing pending payment instead of duplicating it', async () => {
    const pending = { id: 9, orderId: 5, provider: 'COD', reference: 'COD-5', amount: '80.00', status: 'pending' };
    fixture.tables.orders = [[{ id: 5, status: 'pending', totalAmount: '80.00' }]];
    fixture.tables.payments = [[pending], [{ ...pending, status: 'paid' }]];
    await recordManualPayment({ orderId: 5, provider: 'COD', amount: 80, status: 'paid' });
    expect(fixture.writes.find((write) => write.table === 'payments').kind).toBe('update');
    expect(fixture.transactions).toBe(1);
  });

  it('marking a delivered COD payment paid preserves the delivery status', async () => {
    const pending = { id: 9, orderId: 5, provider: 'COD', amount: '80.00', status: 'pending' };
    fixture.tables.orders = [[{ id: 5, status: 'delivered', totalAmount: '80.00' }]];
    fixture.tables.payments = [[pending], [pending], []];
    await changePaymentStatus(9, 'paid');
    expect(fixture.writes.some((write) => write.table === 'orders')).toBe(false);
  });
});

describe('account read routes', () => {
  it('only exposes configured customer support contacts through the public contact route', async () => {
    fixture.tables.admin_settings = [[
      { settingKey: 'support_email', value: 'care@example.invalid' },
      { settingKey: 'support_phone', value: '+91 90000 00000' },
      { settingKey: 'internal_setting', value: 'must-stay-private' },
    ]];
    const response = await request('store', '/contact', 'GET', undefined, '');
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ email: 'care@example.invalid', phone: '+91 90000 00000' });
  });

  it('keeps inactive wishlist pieces visible for removal and marks them unavailable', async () => {
    fixture.tables.wishlist_items = [[{ id: 9, productId: 44, title: 'Archived piece', price: '100.00', salePrice: null, stock: 10, isActive: false, imageFront: null }]];
    const response = await request('wishlist', '/');
    expect((await response.json()).data[0]).toMatchObject({ product_id: 44, available: false, in_stock: false });
  });

  it('returns an empty guest order list without a browser session instead of treating the customer as signed out', async () => {
    const response = await request('checkout', '/guest/orders', 'GET', undefined, '');
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual([]);
    expect(fixture.writes).toHaveLength(0);
  });

  it('returns and updates the signed-in profile', async () => {
    const user = {
      id: 1,
      email: 'buyer@example.invalid',
      name: 'Buyer',
      phone: null,
      role: 'customer',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    fixture.tables.users = [[user]];
    const profile = await request('users', '/me');
    expect(profile.status).toBe(200);
    expect((await profile.json()).data).toMatchObject({ id: 1, name: 'Buyer', role: 'customer' });

    fixture.tables.users = [[{ ...user, name: 'Updated Buyer' }]];
    const updated = await request('users', '/me', 'PUT', { name: 'Updated Buyer' });
    expect(updated.status).toBe(200);
    expect(fixture.writes.find((write) => write.table === 'users').payload).toEqual({ name: 'Updated Buyer' });
  });

  it('lists appointments in the account', async () => {
    const scheduledAt = new Date('2026-11-01T10:30:00Z');
    fixture.tables.appointments = [[{ id: 3, location: 'Mumbai', occasion: 'Fitting', scheduledAt, status: 'upcoming', notes: null }]];
    const response = await request('appointments', '/');
    expect(response.status).toBe(200);
    expect((await response.json()).data[0]).toMatchObject({
      id: 3,
      location: 'Mumbai',
      occasion: 'Fitting',
      scheduled_at: scheduledAt.toISOString(),
      status: 'upcoming',
    });
  });

  it('lists wishlist pieces with product details', async () => {
    fixture.tables.wishlist_items = [[{
      id: 9,
      productId: 44,
      createdAt: new Date('2026-01-02T00:00:00Z'),
      title: 'Fixture kurta',
      slug: 'fixture-kurta',
      price: '100.00',
      salePrice: '80.00',
      stock: 3,
      imageFront: '/fixture.webp',
    }]];
    const response = await request('wishlist', '/');
    expect(response.status).toBe(200);
    expect((await response.json()).data[0]).toMatchObject({
      product_id: 44,
      title: 'Fixture kurta',
      price: 100,
      sale_price: 80,
      in_stock: true,
      image_url: '/fixture.webp',
    });
  });

  it('returns order history with item, payment and address snapshots', async () => {
    const createdAt = new Date('2026-01-03T00:00:00Z');
    fixture.tables.orders = [[{ id: 5, userId: 1, totalAmount: '80.00', status: 'pending', createdAt, updatedAt: createdAt }]];
    fixture.tables.order_items = [[{ id: 1, orderId: 5, productId: 44, title: 'Fixture kurta', quantity: 2, price: '40.00' }]];
    fixture.tables.order_checkout_details = [[{
      orderId: 5,
      userId: 1,
      paymentMethod: 'cod',
      fulfilment: 'home',
      shippingAddress: JSON.stringify(address),
      subtotal: '80.00',
      shippingAmount: '0.00',
    }]];
    fixture.tables.payments = [[{ id: 1, orderId: 5, status: 'pending', createdAt }]];
    fixture.tables.shipments = [[]];
    fixture.tables.order_item_variants = [[{ orderItemId: 1, size: 'M', color: 'Blue', imageUrl: '/fixture.webp' }]];

    const response = await request('orders', '/');
    expect(response.status).toBe(200);
    const order = (await response.json()).data[0];
    expect(order).toMatchObject({
      order_number: 'ORD-0005',
      payment_method: 'cod',
      payment_status: 'pending',
      fulfilment: 'home',
      items_count: 2,
      shipping_address: { city: 'Mumbai' },
    });
    expect(order.items[0]).toMatchObject({ size: 'M', color: 'Blue', quantity: 2 });
  });

  it('returns payments for an owned order', async () => {
    fixture.tables.orders = [[{ id: 44 }]];
    fixture.tables.payments = [[{ id: 2, orderId: 44, provider: 'COD', amount: '80.00', status: 'pending', createdAt: new Date() }]];
    const response = await request('payments', '/order/44');
    expect(response.status).toBe(200);
    expect((await response.json()).data[0]).toMatchObject({ orderId: 44, provider: 'COD', status: 'pending' });
  });

  it('lists shipments for the customer', async () => {
    fixture.tables.shipments = [[{
      id: 1,
      orderId: 44,
      carrier: 'BlueDart',
      trackingNumber: 'TRK-44',
      status: 'in_transit',
      updatedAt: new Date('2026-01-04T00:00:00Z'),
    }]];
    const response = await request('shipping', '/');
    expect(response.status).toBe(200);
    expect((await response.json()).data[0]).toMatchObject({ trackingNumber: 'TRK-44', carrier: 'BlueDart' });
  });
});
