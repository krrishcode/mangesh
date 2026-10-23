import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { products, users, wishlistItems } from '../db/schema';
import { json, type ApiContext } from '../http/context';
import { AppError } from '../lib/errors';
import { addToWishlistSchema } from '../validation';

export async function listWishlist(c: ApiContext) {
  const rows = await db
    .select({
      id: wishlistItems.id,
      productId: wishlistItems.productId,
      createdAt: wishlistItems.createdAt,
      title: products.title,
      slug: products.slug,
      price: products.price,
      salePrice: products.salePrice,
      stock: products.stock,
      imageFront: products.imageFront,
    })
    .from(wishlistItems)
    .innerJoin(products, and(eq(wishlistItems.productId, products.id), eq(products.isActive, true)))
    .where(eq(wishlistItems.userId, c.authUser!.id))
    .orderBy(desc(wishlistItems.createdAt));

  const data = rows.map((row) => ({
    id: row.id,
    product_id: row.productId,
    title: row.title ?? 'Unavailable product',
    slug: row.slug,
    price: row.price !== null ? Number(row.price) : null,
    sale_price: row.salePrice !== null ? Number(row.salePrice) : null,
    in_stock: (row.stock ?? 0) > 0,
    image_url: row.imageFront,
    added_at: row.createdAt,
  }));
  return json(c, { success: true, data });
}

export async function addWishlist(c: ApiContext) {
  const parsed = addToWishlistSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const result = await db.transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, c.authUser!.id)).for('update');
    const [product] = await tx
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, parsed.data.productId), eq(products.isActive, true)))
      .limit(1);
    if (!product) throw new AppError(404, 'Product not found');

    const existing = await tx
      .select({ id: wishlistItems.id })
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, c.authUser!.id), eq(wishlistItems.productId, parsed.data.productId)))
      .limit(1);
    if (existing.length > 0) return { data: { id: existing[0].id }, added: false };

    const [header] = await tx.insert(wishlistItems).values({ userId: c.authUser!.id, productId: parsed.data.productId });
    const [created] = await tx.select().from(wishlistItems).where(eq(wishlistItems.id, header.insertId)).limit(1);
    return { data: created, added: true };
  });

  return json(c, { success: true, data: result.data, message: result.added ? 'Added to wishlist' : 'Already in wishlist' }, result.added ? 201 : 200);
}

export async function removeWishlist(c: ApiContext) {
  const productId = Number(c.params.productId);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return json(c, { success: false, error: 'Invalid product id' }, 400);
  }
  const [deleted] = await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, c.authUser!.id), eq(wishlistItems.productId, productId)));
  if (!deleted.affectedRows) return json(c, { success: false, error: 'Item not found in wishlist' }, 404);
  return json(c, { success: true, message: 'Removed from wishlist' });
}
