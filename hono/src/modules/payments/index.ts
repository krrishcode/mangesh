import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { payments, orders } from '../../db/schema/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

export const paymentsModule = new Hono();
paymentsModule.use('*', requireAuth);
paymentsModule.get('/order/:orderId', async (c) => {
  const id = Number(c.req.param('orderId'));
  if (!Number.isSafeInteger(id) || id <= 0) return c.json({ success: false, error: 'Invalid order ID' }, 400);
  const user = c.get('authUser');
  const [order] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.id, id), ...(user.role === 'admin' ? [] : [eq(orders.userId, user.id)]))).limit(1);
  if (!order) return c.json({ success: false, error: 'Order not found' }, 404);
  const rows = await db.select().from(payments).where(eq(payments.orderId, id)).orderBy(desc(payments.createdAt));
  return c.json({ success: true, data: rows });
});
// Online gateway callbacks must use independently verified provider events.
paymentsModule.post('/record', requireAdmin, (c) => c.json({ success: false, error: 'Use the authenticated admin payment tools to record a collection.' }, 410));
