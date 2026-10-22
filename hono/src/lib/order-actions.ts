import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders, orderItems, orderCheckoutDetails, products, payments, guestOrderDetails } from '../db/schema/index.js';
import { AppError } from './errors.js';

export async function cancelOrder(id: number, customerId?: number, guestSessionHash?: string) {
  return db.transaction(async tx => {
    const owned = and(eq(orders.id, id), ...(customerId === undefined ? [] : [eq(orders.userId, customerId)]));
    const [order] = await tx.select().from(orders).where(owned).limit(1).for('update');
    if (!order) throw new AppError(404, 'Order not found');
    if (guestSessionHash) {
      const [detail] = await tx.select().from(guestOrderDetails).where(and(eq(guestOrderDetails.orderId, id), eq(guestOrderDetails.sessionHash, guestSessionHash))).limit(1).for('update');
      if (!detail || order.userId !== null) throw new AppError(404, 'Order not found. If you saved it to an account, sign in to manage it.');
    }
    if (order.status === 'cancelled') return;
    if (customerId !== undefined || guestSessionHash ? order.status !== 'pending' : !['pending', 'processing'].includes(order.status)) throw new AppError(409, 'This order can no longer be cancelled here. Please contact customer care.');
    const [checkout] = await tx.select().from(orderCheckoutDetails).where(eq(orderCheckoutDetails.orderId, id)).limit(1);
    const paymentRows = await tx.select().from(payments).where(eq(payments.orderId, id));
    if (paymentRows.some(payment => payment.status === 'paid')) throw new AppError(409, 'This order has a recorded payment. Contact customer care to arrange cancellation and any refund.');
    if (checkout) {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      const quantities = new Map<number, number>();
      for (const item of items) if (item.productId) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
      for (const [productId, quantity] of [...quantities].sort(([a], [b]) => a - b)) await tx.update(products).set({ stock: sql`${products.stock} + ${quantity}` }).where(eq(products.id, productId));
    }
    await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, id));
    await tx.update(payments).set({ status: 'failed' }).where(and(eq(payments.orderId, id), eq(payments.status, 'pending')));
  });
}
