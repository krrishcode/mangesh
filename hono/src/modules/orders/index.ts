import { Hono } from 'hono';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { orders, orderItems, orderCheckoutDetails, orderItemVariants, payments, shipments } from '../../db/schema/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { cancelOrder } from '../../lib/order-actions.js';
export const ordersModule = new Hono();
ordersModule.use('*', requireAuth);

export async function orderData(rows: typeof orders.$inferSelect[]) {
  if (!rows.length) return [];
  const ids = rows.map(row => row.id);
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));
  const [details, paymentRows, shipmentRows, variants] = await Promise.all([
    db.select().from(orderCheckoutDetails).where(inArray(orderCheckoutDetails.orderId, ids)),
    db.select().from(payments).where(inArray(payments.orderId, ids)).orderBy(desc(payments.createdAt), desc(payments.id)),
    db.select().from(shipments).where(inArray(shipments.orderId, ids)).orderBy(desc(shipments.updatedAt)),
    items.length ? db.select().from(orderItemVariants).where(inArray(orderItemVariants.orderItemId, items.map(item => item.id))) : Promise.resolve([]),
  ]);
  return rows.map(order => {
    const lines = items.filter(item => item.orderId === order.id);
    const checkout = details.find(detail => detail.orderId === order.id);
    const payment = paymentRows.find(payment => payment.orderId === order.id);
    let address = null;
    try { address = checkout?.shippingAddress ? JSON.parse(checkout.shippingAddress) : null; } catch { /* Legacy orders may have no address snapshot. */ }
    return { id: order.id, guest: order.userId === null, order_number: `ORD-${String(order.id).padStart(4, '0')}`, total_amount: Number(order.totalAmount), status: order.status,
      items_count: lines.reduce((sum, item) => sum + item.quantity, 0), created_at: order.createdAt,
      payment_method: checkout?.paymentMethod || null, payment_status: payment?.status || null,
      fulfilment: checkout?.fulfilment || null, shipping_address: address,
      subtotal: checkout ? Number(checkout.subtotal) : null, shipping_amount: checkout ? Number(checkout.shippingAmount) : null,
      items: lines.map(item => { const variant = variants.find(variant => variant.orderItemId === item.id); return { id: item.id, product_id: item.productId, title: item.title, quantity: item.quantity, price: Number(item.price), size: variant?.size || null, color: variant?.color || null, image_url: variant?.imageUrl || null }; }),
      shipments: shipmentRows.filter(shipment => shipment.orderId === order.id).map(shipment => ({ carrier: shipment.carrier, tracking_number: shipment.trackingNumber, status: shipment.status, updated_at: shipment.updatedAt })),
    };
  });
}
ordersModule.get('/', async c => {
  const rows = await db.select().from(orders).where(eq(orders.userId, c.get('authUser').id)).orderBy(desc(orders.createdAt));
  return c.json({ success: true, data: await orderData(rows) });
});
ordersModule.get('/:id', async c => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) return c.json({ success: false, error: 'Invalid order ID' }, 400);
  const rows = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, c.get('authUser').id))).limit(1);
  if (!rows.length) return c.json({ success: false, error: 'Order not found' }, 404);
  return c.json({ success: true, data: (await orderData(rows))[0] });
});
ordersModule.patch('/:id/cancel', async c => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) return c.json({ success: false, error: 'Invalid order ID' }, 400);
  await cancelOrder(id, c.get('authUser').id);
  return c.json({ success: true, message: 'Order cancelled' });
});
