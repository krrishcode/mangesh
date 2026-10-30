import type { MensProduct } from '../data/mensCollection';
import { stringArray } from './product';

export interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

export function normalizeProduct(raw: Record<string, any>): MensProduct {
  const price = Number(raw.price);
  return {
    ...raw,
    id: String(raw.id),
    slug: String(raw.slug || ''),
    title: String(raw.title || ''),
    category: raw.categoryName || '',
    categorySlug: raw.categorySlug || '',
    price: Number.isFinite(price) ? price : 0,
    salePrice: Number(raw.salePrice) > 0 ? Number(raw.salePrice) : null,
    stock: Math.max(0, Math.floor(Number(raw.stock) || 0)),
    imageFront: raw.imageFront || '',
    imageDetail: raw.imageDetail || '',
    color: raw.color || '',
    colorHex: raw.colorHex || '',
    craft: raw.craft || '',
    description: raw.description || '',
    sizes: stringArray(raw.sizes),
    inStockSizes: stringArray(raw.inStockSizes),
    gallery: stringArray(raw.gallery),
    readyToShip: Boolean(raw.readyToShip),
    deliveryMethod: raw.deliveryMethod || '',
  };
}
