import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  products: [] as any[][],
  categories: [] as any[][],
  fail: false,
  queries: [] as any[],
}));

vi.mock('../db', async () => {
  const { PgDialect } = await import('drizzle-orm/pg-core');
  const name = (table: any) => table[Symbol.for('drizzle:Name')];
  function chain(table: string) {
    const query: any = {
      then: (resolve: any, reject: any) => {
        if (fixture.fail) return Promise.reject(new Error('database fixture offline')).then(resolve, reject);
        const rows = (table === 'categories' ? fixture.categories.shift() : fixture.products.shift()) || [];
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    query.leftJoin = () => query;
    query.where = (condition: any) => {
      if (condition) fixture.queries.push({ table, ...new PgDialect().sqlToQuery(condition) });
      return query;
    };
    query.limit = () => query;
    return query;
  }
  return { db: { select: () => ({ from: (table: any) => chain(name(table)) }) } };
});

import { getCatalogCategories, getCatalogProduct, getCatalogProducts } from '../services/catalog';

const productRow = {
  id: 8,
  title: 'Navy Embroidered Velvet Bandhgala',
  slug: 'navy-velvet-bandhgala',
  sku: 'MM-BDG-203',
  price: '100.00',
  salePrice: '80.00',
  stock: 3,
  categoryId: 2,
  isActive: true,
  imageFront: '/fixture.webp',
  imageDetail: '',
  color: 'Midnight Navy',
  colorHex: '#1a1a2e',
  craft: 'Hand embroidery',
  badge: null,
  sizes: '["M","L"]',
  inStockSizes: '["M","L"]',
  readyToShip: true,
  deliveryMethod: 'both',
  gallery: '["/fixture.webp"]',
  description: 'Fixture product',
  colorVariants: null,
};
const joinedRow = { product: productRow, categoryName: 'Bandhgalas', categorySlug: 'bandhgalas' };

beforeEach(() => {
  fixture.products = [];
  fixture.categories = [];
  fixture.fail = false;
  fixture.queries = [];
});

describe('database-backed catalogue', () => {
  it('normalizes active products with category data', async () => {
    fixture.products = [[joinedRow]];
    const products = await getCatalogProducts();
    expect(products[0]).toMatchObject({
      id: '8',
      title: productRow.title,
      category: 'Bandhgalas',
      categorySlug: 'bandhgalas',
      price: 100,
      salePrice: 80,
      stock: 3,
      sizes: ['M', 'L'],
      gallery: ['/fixture.webp'],
    });
    expect(fixture.queries[0].sql).toContain('is_active');
  });

  it('keeps a healthy empty catalogue empty', async () => {
    fixture.products = [[]];
    await expect(getCatalogProducts()).resolves.toEqual([]);
  });

  it('surfaces database failures instead of returning demo products', async () => {
    fixture.fail = true;
    await expect(getCatalogProducts()).rejects.toThrow('The catalogue is temporarily unavailable. Please try again.');
  });

  it('loads categories from the database', async () => {
    fixture.categories = [[{ id: 2, name: 'Bandhgalas', slug: 'bandhgalas', description: null }]];
    await expect(getCatalogCategories()).resolves.toEqual([
      { id: 2, name: 'Bandhgalas', slug: 'bandhgalas', description: null },
    ]);
  });

  it('looks up numeric IDs and slugs with the active predicate', async () => {
    fixture.products = [[joinedRow], [joinedRow], []];
    expect((await getCatalogProduct('8'))?.id).toBe('8');
    expect((await getCatalogProduct('navy-velvet-bandhgala'))?.id).toBe('8');
    expect(await getCatalogProduct('missing')).toBeUndefined();
    expect(fixture.queries.every((query) => query.sql.includes('is_active'))).toBe(true);
    expect(fixture.queries.some((query) => query.sql.includes('slug'))).toBe(true);
  });
});
