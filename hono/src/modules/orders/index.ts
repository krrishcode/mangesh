import { Hono } from 'hono';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { orders, orderItems } from '../../db/schema/index.js';
import { requireAuth } from '../../middleware/auth.js';

export const ordersModule = new Hono();

ordersModule.use('*', requireAuth);

function mapOrder(order: typeof orders.$inferSelect, items: (typeof orderItems.$inferSelect)[], itemCount: number) {
  return {
    id: order.id,
    order_number: `ORD-${String(order.id).padStart(4, '0')}`,
    total_amount: Number(order.totalAmount),
    status: order.status,
    items_count: itemCount,
    items: items.map((item) => ({
      id: item.id,
      product_id: item.productId,
      title: item.title,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    created_at: order.createdAt,
  };
}

// List the authenticated customer's order history
ordersModule.get('/', async (c) => {
  const authUser = c.get('authUser');
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, authUser.id))
    .orderBy(desc(orders.createdAt));

  if (rows.length === 0) {
    return c.json({ success: true, data: [] });
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((o) => o.id)));

  const data = rows.map((order) => {
    const orderLines = items.filter((i) => i.orderId === order.id);
    const itemCount = orderLines.reduce((sum, i) => sum + i.quantity, 0);
    return mapOrder(order, orderLines, itemCount);
  });

  return c.json({ success: true, data });
});

// Order detail
ordersModule.get('/:id', async (c) => {
  const authUser = c.get('authUser');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid order id' }, 400);

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, authUser.id)))
    .limit(1);

  if (!order) return c.json({ success: false, error: 'Order not found' }, 404);

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return c.json({ success: true, data: mapOrder(order, items, itemCount) });
});
