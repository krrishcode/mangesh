import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { shipments, orders } from '../../db/schema/index.js';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth } from '../../middleware/auth.js';

export const shippingModule = new Hono();
shippingModule.use('*', requireAuth);
const fields = { id: shipments.id, orderId: shipments.orderId, carrier: shipments.carrier, trackingNumber: shipments.trackingNumber, status: shipments.status, updatedAt: shipments.updatedAt };
shippingModule.get('/', async (c) => {
  const user = c.get('authUser');
  const rows = await db.select(fields).from(shipments).innerJoin(orders, eq(shipments.orderId, orders.id))
    .where(user.role === 'admin' ? undefined : eq(orders.userId, user.id)).orderBy(desc(shipments.updatedAt));
  return c.json({ success: true, data: rows });
});
shippingModule.get('/track/:trackingNumber', async (c) => {
  const user = c.get('authUser');
  const [row] = await db.select(fields).from(shipments).innerJoin(orders, eq(shipments.orderId, orders.id))
    .where(and(eq(shipments.trackingNumber, c.req.param('trackingNumber')), ...(user.role === 'admin' ? [] : [eq(orders.userId, user.id)]))).limit(1);
  if (!row) return c.json({ success: false, error: 'Shipment not found' }, 404);
  return c.json({ success: true, data: row });
});
