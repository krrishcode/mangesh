import { and, eq, or } from 'drizzle-orm';
import { db } from '../db';
import { categories, products } from '../db/schema';
import { normalizeProduct, type CatalogCategory } from '../../lib/catalog';
import type { MensProduct } from '../../data/mensCollection';

const UNAVAILABLE = 'The catalogue is temporarily unavailable. Please try again.';

function productSelection() {
  return db
    .select({
      product: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));
}

function normalizeRow(row: {
  product: typeof products.$inferSelect;
  categoryName: string | null;
  categorySlug: string | null;
}): MensProduct {
  return normalizeProduct({ ...row.product, categoryName: row.categoryName, categorySlug: row.categorySlug });
}

export async function getCatalogProducts(): Promise<MensProduct[]> {
  try {
    const rows = await productSelection().where(eq(products.isActive, true));
    return rows.map(normalizeRow);
  } catch {
    throw new Error(UNAVAILABLE);
  }
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  try {
    return await db.select().from(categories);
  } catch {
    throw new Error(UNAVAILABLE);
  }
}

export async function getCatalogProduct(identifier: string): Promise<MensProduct | undefined> {
  const numericId = Number(identifier);
  try {
    const rows = await productSelection()
      .where(
        and(
          Number.isNaN(numericId)
            ? or(eq(products.slug, identifier), eq(products.sku, identifier))
            : eq(products.id, numericId),
          eq(products.isActive, true)
        )
      )
      .limit(1);
    return rows.length ? normalizeRow(rows[0]) : undefined;
  } catch {
    throw new Error(UNAVAILABLE);
  }
}
