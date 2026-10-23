import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { orders, payments } from '../db/schema';
import { json, type ApiContext } from '../http/context';

export async function getOrderPayments(c: ApiContext) {
  const id = Number(c.params.orderId);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid order ID' }, 400);
  const user = c.authUser!;
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, id), ...(user.role === 'admin' ? [] : [eq(orders.userId, user.id)])))
    .limit(1);
  if (!order) return json(c, { success: false, error: 'Order not found' }, 404);
  const rows = await db.select().from(payments).where(eq(payments.orderId, id)).orderBy(desc(payments.createdAt));
  return json(c, { success: true, data: rows });
}

// Online gateway callbacks must use independently verified provider events.
export function recordPaymentBlocked(c: ApiContext) {
  return json(c, { success: false, error: 'Use the authenticated admin payment tools to record a collection.' }, 410);
}
