import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { payments, orders } from '../../db/schema/index.js';

export const paymentsModule = new Hono();

// Health / info
paymentsModule.get('/', (c) => c.json({ success: true, module: 'payments' }));

// Get payments for a specific order
paymentsModule.get('/order/:orderId', async (c) => {
  const orderId = Number(c.req.param('orderId'));
  if (!Number.isInteger(orderId)) {
    return c.json({ success: false, error: 'Invalid order ID' }, 400);
  }

  try {
    const list = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));

    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Record a payment attempt or checkout webhook
paymentsModule.post('/record', async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, provider, reference, amount, status } = body;

    if (!orderId || !amount) {
      return c.json({ success: false, error: 'orderId and amount are required' }, 400);
    }

    const [header] = await db.insert(payments).values({
      orderId: Number(orderId),
      provider: provider || 'Razorpay Online',
      reference: reference || `PAY-${Date.now()}`,
      amount: String(amount),
      status: (status as any) || 'paid',
    });

    if (status === 'paid') {
      await db.update(orders).set({ status: 'processing' }).where(eq(orders.id, Number(orderId)));
    }

    const [created] = await db.select().from(payments).where(eq(payments.id, header.insertId)).limit(1);
    return c.json({ success: true, data: created, message: 'Payment recorded' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
