import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { orderCheckoutDetails, orderItems, orderItemVariants, orders, payments, shipments } from '../db/schema';
import { json, type ApiContext } from '../http/context';
import { cancelOrder } from '../lib/order-actions';

export async function orderData(rows: (typeof orders.$inferSelect)[]) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));
  const [details, paymentRows, shipmentRows, variants] = await Promise.all([
    db.select().from(orderCheckoutDetails).where(inArray(orderCheckoutDetails.orderId, ids)),
    db.select().from(payments).where(inArray(payments.orderId, ids)).orderBy(desc(payments.createdAt), desc(payments.id)),
    db.select().from(shipments).where(inArray(shipments.orderId, ids)).orderBy(desc(shipments.updatedAt)),
    items.length
      ? db.select().from(orderItemVariants).where(inArray(orderItemVariants.orderItemId, items.map((item) => item.id)))
      : Promise.resolve([]),
  ]);
  return rows.map((order) => {
    const lines = items.filter((item) => item.orderId === order.id);
    const checkout = details.find((detail) => detail.orderId === order.id);
    const payment = paymentRows.find((row) => row.orderId === order.id);
    let address = null;
    try {
      address = checkout?.shippingAddress ? JSON.parse(checkout.shippingAddress) : null;
    } catch {
      /* Legacy orders may have no address snapshot. */
    }
    return {
      id: order.id,
      guest: order.userId === null,
      order_number: `ORD-${String(order.id).padStart(4, '0')}`,
      total_amount: Number(order.totalAmount),
      status: order.status,
      items_count: lines.reduce((sum, item) => sum + item.quantity, 0),
      created_at: order.createdAt,
      payment_method: checkout?.paymentMethod || null,
      payment_status: payment?.status || null,
      fulfilment: checkout?.fulfilment || null,
      shipping_address: address,
      subtotal: checkout ? Number(checkout.subtotal) : null,
      shipping_amount: checkout ? Number(checkout.shippingAmount) : null,
      items: lines.map((item) => {
        const variant = variants.find((row) => row.orderItemId === item.id);
        return {
          id: item.id,
          product_id: item.productId,
          title: item.title,
          quantity: item.quantity,
          price: Number(item.price),
          size: variant?.size || null,
          color: variant?.color || null,
          image_url: variant?.imageUrl || null,
        };
      }),
      shipments: shipmentRows
        .filter((shipment) => shipment.orderId === order.id)
        .map((shipment) => ({
          carrier: shipment.carrier,
          tracking_number: shipment.trackingNumber,
          status: shipment.status,
          updated_at: shipment.updatedAt,
        })),
    };
  });
}

export async function listOrders(c: ApiContext) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, c.authUser!.id))
    .orderBy(desc(orders.createdAt));
  return json(c, { success: true, data: await orderData(rows) });
}

export async function getOrder(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid order ID' }, 400);
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, c.authUser!.id)))
    .limit(1);
  if (!rows.length) return json(c, { success: false, error: 'Order not found' }, 404);
  return json(c, { success: true, data: (await orderData(rows))[0] });
}

export async function cancelCustomerOrder(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid order ID' }, 400);
  await cancelOrder(id, c.authUser!.id);
  return json(c, { success: true, message: 'Order cancelled' });
}
