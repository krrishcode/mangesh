import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { orders, shipments } from '../db/schema';
import { json, type ApiContext } from '../http/context';

const fields = {
  id: shipments.id,
  orderId: shipments.orderId,
  carrier: shipments.carrier,
  trackingNumber: shipments.trackingNumber,
  status: shipments.status,
  updatedAt: shipments.updatedAt,
};

export async function listShipments(c: ApiContext) {
  const user = c.authUser!;
  const rows = await db
    .select(fields)
    .from(shipments)
    .innerJoin(orders, eq(shipments.orderId, orders.id))
    .where(user.role === 'admin' ? undefined : eq(orders.userId, user.id))
    .orderBy(desc(shipments.updatedAt));
  return json(c, { success: true, data: rows });
}

export async function trackShipment(c: ApiContext) {
  const user = c.authUser!;
  const [row] = await db
    .select(fields)
    .from(shipments)
    .innerJoin(orders, eq(shipments.orderId, orders.id))
    .where(
      and(
        eq(shipments.trackingNumber, c.params.trackingNumber),
        ...(user.role === 'admin' ? [] : [eq(orders.userId, user.id)])
      )
    )
    .limit(1);
  if (!row) return json(c, { success: false, error: 'Shipment not found' }, 404);
  return json(c, { success: true, data: row });
}
