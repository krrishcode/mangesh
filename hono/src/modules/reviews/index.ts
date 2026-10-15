import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { reviews, users, products } from '../../db/schema/index.js';
import { eq, desc, and } from 'drizzle-orm';

export const reviewsModule = new Hono();

reviewsModule.get('/', async (c) => {
  try {
    const productId = c.req.query('productId');
    let query = db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        productTitle: products.title,
        userId: reviews.userId,
        userName: users.name,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        status: reviews.status,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.status, 'approved'))
      .orderBy(desc(reviews.createdAt));

    const data = await query;
    const filtered = productId ? data.filter((r) => String(r.productId) === String(productId)) : data;

    return c.json({ success: true, data: filtered });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
