import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { shipments, orders } from '../../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const shippingModule = new Hono();

shippingModule.get('/', async (c) => {
  try {
    const data = await db
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        carrier: shipments.carrier,
        trackingNumber: shipments.trackingNumber,
        status: shipments.status,
        updatedAt: shipments.updatedAt,
      })
      .from(shipments)
      .orderBy(desc(shipments.updatedAt));

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

shippingModule.get('/track/:trackingNumber', async (c) => {
  const trackingNumber = c.req.param('trackingNumber');
  try {
    const [shipment] = await db
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        carrier: shipments.carrier,
        trackingNumber: shipments.trackingNumber,
        status: shipments.status,
        updatedAt: shipments.updatedAt,
      })
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber))
      .limit(1);

    if (!shipment) {
      return c.json({ success: false, error: 'Tracking number not found' }, 404);
    }

    return c.json({ success: true, data: shipment });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
