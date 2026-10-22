import { Hono, type Context } from 'hono';
import { eq, and, inArray, sql, gt } from 'drizzle-orm';
import { createHash } from 'crypto';
import { db } from '../../db/index.js';
import { users, products, addresses, orders, orderItems, payments, orderCheckoutDetails, orderItemVariants, guestSessions, guestOrderDetails } from '../../db/schema/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { quoteSchema, checkoutSchema, guestCheckoutSchema, quoteItems } from '../../lib/checkout.js';
import { createAddressSchema } from '../../validation/index.js';
import { AppError } from '../../lib/errors.js';
import { rateLimit } from '../../middleware/rate-limit.js';
import { guestSession } from '../../lib/guest-session.js';
import { orderData } from '../orders/index.js';
import { browserSessionRequest } from '../../middleware/browser-session.js';
import { cancelOrder } from '../../lib/order-actions.js';

export const checkoutModule = new Hono();
checkoutModule.use('*', browserSessionRequest);
checkoutModule.post('/session', rateLimit(20), async c => { await guestSession(c, true); return c.json({ success: true }); });
checkoutModule.get('/guest/orders', rateLimit(30), async c => {
  const session = await guestSession(c);
  const details = await db.select().from(guestOrderDetails).where(eq(guestOrderDetails.sessionHash, session.tokenHash));
  if (!details.length) return c.json({ success: true, data: [] });
  const rows = await db.select().from(orders).where(inArray(orders.id, details.map(detail => detail.orderId))).orderBy(orders.id);
  return c.json({ success: true, data: await orderData(rows) });
});
checkoutModule.get('/guest/orders/:id', rateLimit(30), async c => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, 'Invalid order number.');
  const session = await guestSession(c);
  const [detail] = await db.select().from(guestOrderDetails).where(and(eq(guestOrderDetails.orderId, id), eq(guestOrderDetails.sessionHash, session.tokenHash))).limit(1);
  if (!detail) throw new AppError(404, 'Order not found.');
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!rows.length) throw new AppError(404, 'Order not found.');
  return c.json({ success: true, data: (await orderData(rows))[0] });
});
// Possession of this browser's secret receipt session plus account authentication
// is required. Matching an unverified email alone never grants order access.
checkoutModule.patch('/guest/orders/:id/cancel', rateLimit(10), async c => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, 'Invalid order number.');
  const session = await guestSession(c);
  await cancelOrder(id, undefined, session.tokenHash);
  return c.json({ success: true, message: 'Order cancelled.' });
});
checkoutModule.post('/guest/orders/:id/claim', requireAuth, async c => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, 'Invalid order number.');
  const session = await guestSession(c);
  const user = c.get('authUser');
  await db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1).for('update');
    if (!order || (order.userId !== null && order.userId !== user.id)) throw new AppError(404, 'Order not found.');
    const [detail] = await tx.select().from(guestOrderDetails).where(and(eq(guestOrderDetails.orderId, id), eq(guestOrderDetails.sessionHash, session.tokenHash))).limit(1).for('update');
    if (!detail) throw new AppError(404, 'Order not found.');
    await tx.update(orders).set({ userId: user.id }).where(eq(orders.id, id));
    await tx.update(orderCheckoutDetails).set({ userId: user.id }).where(eq(orderCheckoutDetails.orderId, id));
  });
  return c.json({ success: true });
});
checkoutModule.post('/quote', async (c) => {
  const parsed = quoteSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: 'Check the products and quantities in your bag.' }, 400);
  const rows = await db.select().from(products).where(inArray(products.id, parsed.data.items.map(item => item.product_id)));
  return c.json({ success: true, data: quoteItems(rows, parsed.data.items, parsed.data.fulfilment) });
});
async function placeOrder(c: Context, guest = false) {
  const parsed = (guest ? guestCheckoutSchema : checkoutSchema).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: parsed.error.issues.find(issue => issue.path.includes('phone'))?.message || 'Check your contact details, delivery address, bag and payment method.' }, 400);
  const user = guest ? null : c.get('authUser');
  const session = guest ? await guestSession(c) : null;
  const input = parsed.data;
  const guestInput = guest ? guestCheckoutSchema.parse(input) : null;
  const addressId = 'addressId' in input ? input.addressId : undefined;
  if (process.env.COD_ENABLED === 'false') throw new AppError(503, 'Cash on delivery is currently unavailable. Please contact customer care.');
  const requestKey = createHash('sha256').update(`${user ? user.id : `guest:${session!.tokenHash}`}:${input.requestId}`).digest('hex');
  const canonical = { items: [...input.items].sort((a, b) => a.product_id - b.product_id || a.color.localeCompare(b.color) || a.size.localeCompare(b.size)), fulfilment: input.fulfilment, addressId, paymentMethod: input.paymentMethod, expectedTotal: input.expectedTotal, ...(guestInput ? { contact: guestInput.contact, shippingAddress: guestInput.shippingAddress } : {}) };
  const requestHash = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  const result = await db.transaction(async (tx) => {
    // Serializing a customer's submissions makes repeated requests idempotent.
    if (user) await tx.select({ id: users.id }).from(users).where(eq(users.id, user.id)).for('update');
    else {
      const [locked] = await tx.select().from(guestSessions).where(and(eq(guestSessions.tokenHash, session!.tokenHash), gt(guestSessions.expiresAt, new Date()))).limit(1).for('update');
      if (!locked) throw new AppError(401, 'Please refresh checkout to continue.');
    }
    const [existing] = await tx.select().from(orderCheckoutDetails).where(eq(orderCheckoutDetails.requestKey, requestKey)).limit(1);
    if (existing) {
      if ((user && existing.userId !== user.id) || existing.requestHash !== requestHash) throw new AppError(409, 'This checkout request has already been used. Refresh your order summary.');
      return { id: existing.orderId, repeated: true };
    }
    let address = null;
    if (input.fulfilment === 'home') {
      if (guestInput) address = createAddressSchema.parse(guestInput.shippingAddress);
      else {
        if (!addressId) throw new AppError(400, 'Choose a delivery address.');
        const [saved] = await tx.select().from(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, user!.id), eq(addresses.label, 'shipping'))).limit(1).for('update');
        if (!saved) throw new AppError(404, 'Delivery address not found.');
        address = createAddressSchema.parse(saved);
      }
    }
    const ids = [...new Set(input.items.map(item => item.product_id))].sort((a, b) => a - b);
    const rows = await tx.select().from(products).where(inArray(products.id, ids)).orderBy(products.id).for('update');
    const quote = quoteItems(rows, input.items, input.fulfilment);
    if (quote.total !== input.expectedTotal) throw new AppError(409, 'Prices or delivery charges have changed. Review the updated summary before placing your order.');
    for (const id of ids) {
      const quantity = input.items.filter(item => item.product_id === id).reduce((sum, item) => sum + item.quantity, 0);
      const [updated] = await tx.update(products).set({ stock: sql`${products.stock} - ${quantity}` }).where(and(eq(products.id, id), sql`${products.stock} >= ${quantity}`, eq(products.isActive, true)));
      if (updated.affectedRows !== 1) throw new AppError(409, 'Stock changed while placing your order. Review your bag.');
    }
    const [created] = await tx.insert(orders).values({ userId: user?.id ?? null, totalAmount: (quote.total / 100).toFixed(2), status: 'pending' });
    for (const line of quote.lines) {
      const [item] = await tx.insert(orderItems).values({ orderId: created.insertId, productId: line.product_id, title: line.title, price: (line.unitPrice / 100).toFixed(2), quantity: line.quantity });
      await tx.insert(orderItemVariants).values({ orderItemId: item.insertId, size: line.size, color: line.color, sku: line.sku, imageUrl: line.image_url });
    }
    await tx.insert(orderCheckoutDetails).values({ orderId: created.insertId, userId: user?.id ?? null, requestKey, requestHash, shippingAddress: address ? JSON.stringify(address) : null, fulfilment: input.fulfilment, paymentMethod: 'cod', subtotal: (quote.subtotal / 100).toFixed(2), shippingAmount: (quote.shipping / 100).toFixed(2) });
    if (guestInput) await tx.insert(guestOrderDetails).values({ orderId: created.insertId, sessionHash: session!.tokenHash, ...guestInput.contact });
    await tx.insert(payments).values({ orderId: created.insertId, provider: 'COD', reference: `COD-${created.insertId}`, amount: (quote.total / 100).toFixed(2), status: 'pending' });
    return { id: created.insertId, repeated: false };
  });
  return c.json({ success: true, data: { ...result, order_number: `ORD-${String(result.id).padStart(4, '0')}`, payment_method: 'cod', payment_status: 'pending' } }, result.repeated ? 200 : 201);
}
checkoutModule.post('/', requireAuth, rateLimit(10), c => placeOrder(c));
checkoutModule.post('/guest', rateLimit(10), c => placeOrder(c, true));
