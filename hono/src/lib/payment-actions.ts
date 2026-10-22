import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { orders, payments } from '../db/schema/index.js';
import { AppError } from './errors.js';

export const manualPaymentSchema = z.object({ orderId: z.coerce.number().int().positive(), amount: z.coerce.number().positive().max(99999999.99).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001), provider: z.string().trim().min(1).max(64).default('COD'), reference: z.string().trim().min(1).max(255).optional(), status: z.enum(['pending','paid','failed','refunded']).default('paid') });
export const paymentStatusSchema = z.enum(['pending','paid','failed','refunded']);

export async function recordManualPayment(input: z.infer<typeof manualPaymentSchema>) {
  return db.transaction(async tx => {
    // All payment collection and cancellation serialize on the parent order.
    const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).limit(1).for('update');
    if (!order) throw new AppError(404, 'Order not found');
    if (order.status === 'cancelled') throw new AppError(409, 'Payments cannot be collected for a cancelled order.');
    const rows = await tx.select().from(payments).where(eq(payments.orderId, order.id));
    const cod = input.provider === 'COD' ? rows.find(row => row.provider === 'COD' && row.status === 'pending') : undefined;
    const otherPaid = rows.filter(row => row.status === 'paid' && row.id !== cod?.id).reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0);
    if (input.status === 'paid' && otherPaid + Math.round(input.amount * 100) > Math.round(Number(order.totalAmount) * 100)) throw new AppError(409, 'This collection would exceed the order total.');
    if (input.provider === 'COD' && Math.round(input.amount * 100) !== Math.round(Number(order.totalAmount) * 100)) throw new AppError(400, 'The COD collection must match the order total.');
    const values = { orderId: order.id, provider: input.provider, reference: input.reference || cod?.reference || `MAN-${randomUUID()}`, amount: input.amount.toFixed(2), status: input.status };
    let id = cod?.id;
    if (id) await tx.update(payments).set(values).where(eq(payments.id, id));
    else { const [result] = await tx.insert(payments).values(values); id = result.insertId; }
    if (input.status === 'paid' && order.status === 'pending') await tx.update(orders).set({ status: 'processing' }).where(eq(orders.id, order.id));
    const [record] = await tx.select().from(payments).where(eq(payments.id, id!)).limit(1);
    return record;
  });
}

export async function changePaymentStatus(id: number, status: z.infer<typeof paymentStatusSchema>) {
  const [initial] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!initial) throw new AppError(404, 'Payment not found');
  return db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, initial.orderId)).limit(1).for('update');
    if (!order) throw new AppError(404, 'Order not found');
    const [payment] = await tx.select().from(payments).where(and(eq(payments.id, id), eq(payments.orderId, order.id))).limit(1).for('update');
    if (!payment) throw new AppError(404, 'Payment not found');
    if (payment.status === status) return payment;
    if (status === 'paid' && order.status === 'cancelled') throw new AppError(409, 'Payments cannot be collected for a cancelled order.');
    if (payment.status === 'paid' && status !== 'refunded') throw new AppError(409, 'A paid collection can only be marked refunded.');
    if (payment.status === 'refunded') throw new AppError(409, 'Record a new collection instead of changing a refunded payment.');
    if (status === 'refunded' && payment.status !== 'paid') throw new AppError(409, 'Only a paid collection can be marked refunded.');
    if (status === 'paid') {
      const rows = await tx.select().from(payments).where(eq(payments.orderId, order.id));
      const total = rows.filter(row => row.status === 'paid' && row.id !== id).reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0) + Math.round(Number(payment.amount) * 100);
      if (total > Math.round(Number(order.totalAmount) * 100)) throw new AppError(409, 'This collection would exceed the order total.');
    }
    await tx.update(payments).set({ status }).where(eq(payments.id, id));
    if (status === 'paid' && order.status === 'pending') await tx.update(orders).set({ status: 'processing' }).where(eq(orders.id, order.id));
    return { ...payment, status };
  });
}
