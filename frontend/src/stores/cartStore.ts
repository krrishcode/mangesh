import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItemDto } from '../types';
import type { MensProduct } from '../data/mensCollection';
import { effectivePrice, productVariants } from '../lib/product';
export const cartLineId = (item: Pick<CartItemDto, 'product_id' | 'color' | 'size'>) => JSON.stringify([String(item.product_id), item.color, item.size]);
export const migrateCartState = (stored: any) => ({
  items: Array.isArray(stored?.items) ? stored.items.map((item: any) => ({ ...item, size: typeof item.size === 'string' ? item.size : '', color: typeof item.color === 'string' ? item.color : '', max_quantity: Number.isSafeInteger(item.max_quantity) ? item.max_quantity : 0 })) : [],
  needsReview: Boolean(stored?.items?.length),
});
interface CartState {
  items: CartItemDto[]; needsReview: boolean;
  addItem: (item: CartItemDto) => boolean;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  syncProducts: (products: MensProduct[]) => void;
  clearCart: () => void; totalItems: () => number; totalPrice: () => number;
}
export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [], needsReview: false,
  addItem(item) {
    if (!item.size || !Number.isFinite(item.price) || item.price <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || !Number.isSafeInteger(item.max_quantity) || item.max_quantity <= 0) return false;
    const current = get().items;
    const total = current.filter(line => String(line.product_id) === String(item.product_id)).reduce((sum, line) => sum + line.quantity, 0);
    if (total + item.quantity > item.max_quantity) return false;
    const line_id = cartLineId(item);
    const existing = current.find(line => cartLineId(line) === line_id);
    set({ items: existing ? current.map(line => cartLineId(line) === line_id ? { ...item, line_id, quantity: line.quantity + item.quantity } : line) : [...current, { ...item, line_id }] });
    return true;
  },
  removeItem(lineId) { set({ items: get().items.filter(line => cartLineId(line) !== lineId) }); },
  updateQuantity(lineId, quantity) {
    if (!Number.isSafeInteger(quantity)) return;
    if (quantity <= 0) { get().removeItem(lineId); return; }
    const items = get().items;
    const line = items.find(item => cartLineId(item) === lineId);
    if (!line) return;
    const other = items.filter(item => String(item.product_id) === String(line.product_id) && cartLineId(item) !== lineId).reduce((sum, item) => sum + item.quantity, 0);
    if (quantity + other > line.max_quantity) return;
    set({ items: items.map(item => cartLineId(item) === lineId ? { ...item, quantity } : item) });
  },
  syncProducts(products) {
    set({ items: get().items.map(item => {
      const product = products.find(product => product.id === String(item.product_id));
      const variant = product && productVariants(product).find(variant => variant.color === item.color && variant.inStockSizes.includes(item.size));
      return product && variant ? { ...item, title: product.title, price: effectivePrice(product), image_url: variant.imageFront, max_quantity: product.stock } : { ...item, max_quantity: 0 };
    }) });
  },
  clearCart() { set({ items: [], needsReview: false }); },
  totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  totalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
}), {
  name: 'ecommerce-cart-storage', version: 2,
  migrate: migrateCartState,
}));
