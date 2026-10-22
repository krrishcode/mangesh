import { z } from 'zod';
import type { ProductRecord } from '../db/schema/index.js';
import { AppError } from './errors.js';
import { createAddressSchema, phoneSchema } from '../validation/index.js';

export const checkoutItemSchema = z.object({ product_id: z.coerce.number().int().positive(), quantity: z.number().int().min(1).max(99), size: z.string().min(1).max(64), color: z.string().max(100) });
export const quoteSchema = z.object({ items: z.array(checkoutItemSchema).min(1).max(50), fulfilment: z.enum(['home', 'pickup']) });
export const checkoutSchema = quoteSchema.extend({ addressId: z.number().int().positive().optional(), paymentMethod: z.literal('cod'), requestId: z.string().uuid(), expectedTotal: z.number().int().positive() });
export const guestCheckoutSchema = checkoutSchema.omit({ addressId: true }).extend({
  contact: z.object({ email: z.string().trim().email().max(255).transform(value => value.toLowerCase()), name: z.string().trim().min(2).max(255), phone: phoneSchema }),
  shippingAddress: createAddressSchema.optional(),
}).refine(value => value.fulfilment !== 'home' || Boolean(value.shippingAddress), { message: 'Enter your delivery address.' });
export type CheckoutItem = z.infer<typeof checkoutItemSchema>;

function strings(value: unknown): string[] {
  try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : []; } catch { return []; }
}
function variants(product: ProductRecord) {
  let raw: unknown = product.colorVariants;
  try { if (typeof raw === 'string') raw = JSON.parse(raw); } catch { raw = []; }
  return Array.isArray(raw) && raw.length ? raw : [{ color: product.color || '', imageFront: product.imageFront, sizes: strings(product.sizes), inStockSizes: strings(product.inStockSizes) }];
}
export function priceInPaise(product: Pick<ProductRecord, 'price' | 'salePrice'>) {
  const base = Math.round(Number(product.price) * 100);
  const sale = Math.round(Number(product.salePrice) * 100);
  const price = sale > 0 && sale < base ? sale : base;
  if (!Number.isSafeInteger(price) || price <= 0) throw new AppError(409, 'A selected product requires a price enquiry.');
  return price;
}
export function quoteItems(products: ProductRecord[], items: CheckoutItem[], fulfilment: 'home' | 'pickup') {
  const totals = new Map<number, number>();
  const keys = new Set<string>();
  const lines = items.map(item => {
    const product = products.find(product => product.id === item.product_id && product.isActive);
    if (!product) throw new AppError(409, 'A selected product is no longer available. Update your bag.');
    const key = JSON.stringify([item.product_id, item.color, item.size]);
    if (keys.has(key)) throw new AppError(400, 'Duplicate bag lines. Please refresh your bag.');
    keys.add(key);
    const variant = variants(product).find(v => v && v.color === item.color && strings(v.sizes).includes(item.size) && strings(v.inStockSizes).includes(item.size));
    if (!variant) throw new AppError(409, `${product.title}: the selected colour or size is unavailable.`);
    const quantity = (totals.get(product.id) || 0) + item.quantity;
    totals.set(product.id, quantity);
    if (quantity > product.stock) throw new AppError(409, `${product.title}: only ${Math.max(0, product.stock)} available. Update your bag.`);
    if (product.deliveryMethod !== 'both' && product.deliveryMethod !== fulfilment) throw new AppError(409, `${product.title} does not support the selected delivery method.`);
    return { ...item, title: product.title, sku: product.sku, image_url: variant.imageFront || product.imageFront, unitPrice: priceInPaise(product), stock: product.stock };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const fee = Number(process.env.SHIPPING_FEE_INR || '0');
  if (!Number.isFinite(fee) || fee < 0) throw new AppError(503, 'Delivery pricing is temporarily unavailable.');
  const shipping = fulfilment === 'home' ? Math.round(fee * 100) : 0;
  const total = subtotal + shipping;
  if (!Number.isSafeInteger(total) || total > 9999999999) throw new AppError(400, 'The bag total exceeds the supported order amount.');
  return { lines, subtotal, shipping, total, currency: 'INR', paymentMethod: 'cod' };
}
