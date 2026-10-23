import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySqlDialect } from 'drizzle-orm/mysql-core';

const fixture = vi.hoisted(() => ({
  tables: {} as Record<string, any[][]>,
  writes: [] as any[],
  queries: [] as any[],
  nextId: 1000,
}));

vi.mock('../db', () => {
  const name = (table: any) => table[Symbol.for('drizzle:Name')];
  function chain(rows: any, table = '') {
    const query: any = { then: (resolve: any, reject: any) => Promise.resolve(rows).then(resolve, reject) };
    for (const method of ['limit', 'orderBy', 'for', 'innerJoin', 'leftJoin', 'groupBy']) query[method] = () => query;
    query.where = (condition: any) => {
      if (condition) fixture.queries.push({ table, ...new MySqlDialect().sqlToQuery(condition) });
      return query;
    };
    return query;
  }
  const db: any = {
    select: () => ({ from: (table: any) => chain(fixture.tables[name(table)]?.shift() || [], name(table)) }),
    insert: (table: any) => ({
      values: (payload: any) => {
        fixture.writes.push({ kind: 'insert', table: name(table), payload });
        return chain([{ insertId: ++fixture.nextId, affectedRows: 1 }], name(table));
      },
    }),
    update: (table: any) => ({
      set: (payload: any) => {
        fixture.writes.push({ kind: 'update', table: name(table), payload });
        return chain([{ affectedRows: 1 }], name(table));
      },
    }),
    delete: (table: any) => {
      fixture.writes.push({ kind: 'delete', table: name(table) });
      return chain([{ affectedRows: 1 }], name(table));
    },
  };
  return { db };
});

vi.mock('../http/auth', async () => {
  const { AppError } = await import('../lib/errors');
  return {
    authenticate: async (request: Request) => {
      const token = request.headers.get('authorization');
      if (!['Bearer admin', 'Bearer customer'].includes(token || '')) {
        throw new AppError(401, 'Unauthorized: missing bearer token');
      }
      return { id: 1, email: 'admin@example.invalid', role: token === 'Bearer admin' ? 'admin' : 'customer' };
    },
  };
});

import { handleApi } from '../http/router';
import { resetRateLimits } from '../http/rate-limit';

function request(path: string, method = 'GET', body?: unknown, token = 'admin') {
  return handleApi(
    new Request(`http://localhost/api/account${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    path.split('/').filter(Boolean)
  );
}

beforeEach(() => {
  fixture.tables = {};
  fixture.writes = [];
  fixture.queries = [];
  fixture.nextId = 1000;
  resetRateLimits();
});

describe('admin authorization', () => {
  it('rejects anonymous and customer access before touching the database', async () => {
    expect((await request('/admin/dashboard', 'GET', undefined, '')).status).toBe(401);
    expect((await request('/admin/dashboard', 'GET', undefined, 'customer')).status).toBe(403);
    expect(fixture.queries).toHaveLength(0);
    expect(fixture.writes).toHaveLength(0);
  });
});

describe('admin dashboard and catalogue management', () => {
  it('returns aggregate stats and recent orders', async () => {
    fixture.tables.products = [[{ value: 5 }], [{ value: 2 }]];
    fixture.tables.orders = [
      [{ value: 3 }],
      [{ value: '250.00' }],
      [{ value: 1 }],
      [{
        id: 11,
        userId: null,
        totalAmount: '100.00',
        status: 'pending',
        createdAt: new Date('2026-01-05T00:00:00Z'),
        customerName: 'Guest Buyer',
        customerEmail: 'guest@example.invalid',
      }],
    ];
    fixture.tables.users = [[{ value: 2 }]];

    const response = await request('/admin/dashboard');
    expect(response.status).toBe(200);
    const data = (await response.json()).data;
    expect(data.stats).toEqual({
      totalProducts: 5,
      totalOrders: 3,
      totalCustomers: 2,
      totalRevenue: 250,
      pendingOrders: 1,
      lowStockItems: 2,
    });
    expect(data.recentOrders[0]).toMatchObject({
      order_number: 'ORD-0011',
      customer_name: 'Guest Buyer',
      total_amount: 100,
      status: 'pending',
    });
  });

  it('rejects incomplete product creation without writing', async () => {
    const response = await request('/admin/products', 'POST', { title: 'Only a title' });
    expect(response.status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it('creates a product with serialized variants and defaults', async () => {
    fixture.tables.products = [[{ id: 1001, title: 'Fixture Product' }]];
    const response = await request('/admin/products', 'POST', {
      title: 'Fixture Product',
      slug: 'fixture-product',
      price: 100,
      sku: 'MM-1',
      stock: 4,
      categoryId: 2,
      isActive: false,
      sizes: ['M', 'L'],
      gallery: ['https://example.com/a.jpg'],
    });
    expect(response.status).toBe(201);
    const write = fixture.writes.find((entry) => entry.table === 'products' && entry.kind === 'insert');
    expect(write.payload).toMatchObject({
      title: 'Fixture Product',
      slug: 'fixture-product',
      price: '100',
      sku: 'MM-1',
      stock: 4,
      categoryId: 2,
      isActive: false,
      sizes: '["M","L"]',
      gallery: '["https://example.com/a.jpg"]',
      componentsCount: 1,
      countryOfOrigin: 'India',
      deliveryMethod: 'both',
    });
  });

  it('updates only supplied product fields', async () => {
    fixture.tables.products = [[{ id: 8, title: 'Updated', sizes: '["L"]' }]];
    const response = await request('/admin/products/8', 'PUT', {
      title: 'Updated',
      sizes: ['L'],
      salePrice: 0,
    });
    expect(response.status).toBe(200);
    expect(fixture.writes[0].payload).toEqual({ title: 'Updated', sizes: '["L"]', salePrice: null });
  });
});

describe('admin operations', () => {
  it('rejects invalid order statuses and reopening cancelled orders', async () => {
    expect((await request('/admin/orders/5/status', 'PATCH', { status: 'bogus' })).status).toBe(400);
    expect(fixture.writes).toHaveLength(0);

    fixture.tables.orders = [[{ id: 5, status: 'cancelled' }]];
    expect((await request('/admin/orders/5/status', 'PATCH', { status: 'shipped' })).status).toBe(409);
    expect(fixture.writes).toHaveLength(0);

    fixture.tables.orders = [[{ id: 5, status: 'pending' }]];
    expect((await request('/admin/orders/5/status', 'PATCH', { status: 'shipped' })).status).toBe(200);
    expect(fixture.writes[0].payload).toEqual({ status: 'shipped' });
  });

  it('inserts a new setting and updates an existing one', async () => {
    fixture.tables.admin_settings = [[]];
    expect((await request('/admin/settings', 'PUT', { key: 'shipping_fee', value: '99' })).status).toBe(200);
    expect(fixture.writes[0]).toMatchObject({
      kind: 'insert',
      table: 'admin_settings',
      payload: { settingKey: 'shipping_fee', value: '99' },
    });

    fixture.tables.admin_settings = [[{ id: 1, settingKey: 'shipping_fee' }]];
    expect((await request('/admin/settings', 'PUT', { key: 'shipping_fee', value: '149' })).status).toBe(200);
    expect(fixture.writes[1]).toMatchObject({ kind: 'update', payload: { value: '149' } });
  });

  it('requires name and slug to create a category', async () => {
    expect((await request('/admin/categories', 'POST', { name: 'Kurtas' })).status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it('creates a category and returns it', async () => {
    fixture.tables.categories = [[{ id: 2, name: 'Kurtas', slug: 'kurtas' }]];
    const response = await request('/admin/categories', 'POST', { name: 'Kurtas', slug: 'kurtas' });
    expect(response.status).toBe(201);
    expect(fixture.writes[0]).toMatchObject({
      kind: 'insert',
      table: 'categories',
      payload: { name: 'Kurtas', slug: 'kurtas', description: null },
    });
  });

  it('returns an empty payment view with zeroed stats', async () => {
    fixture.tables.payments = [[]];
    const response = await request('/admin/payments');
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data).toEqual([]);
    expect(result.stats).toMatchObject({ total_count: 0, total_settled: 0 });
  });

  it('rejects invalid manual payment payloads', async () => {
    expect((await request('/admin/payments', 'POST', { orderId: 5, amount: -1, status: 'paid' })).status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });
});
