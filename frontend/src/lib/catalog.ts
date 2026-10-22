import type { MensProduct } from '../data/mensCollection';
import { stringArray } from './product';
const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export interface CatalogCategory { id: number; name: string; slug: string; image?: string }
export function normalizeProduct(raw: Record<string, any>): MensProduct {
  const price = Number(raw.price);
  return { ...raw, id: String(raw.id), title: String(raw.title || ''),
    category: raw.categoryName || '', categorySlug: raw.categorySlug || '',
    price: Number.isFinite(price) ? price : 0, salePrice: Number(raw.salePrice) > 0 ? Number(raw.salePrice) : null,
    stock: Math.max(0, Math.floor(Number(raw.stock) || 0)),
    imageFront: raw.imageFront || '', imageDetail: raw.imageDetail || '',
    color: raw.color || '', colorHex: raw.colorHex || '', craft: raw.craft || '', description: raw.description || '',
    sizes: stringArray(raw.sizes), inStockSizes: stringArray(raw.inStockSizes),
    gallery: stringArray(raw.gallery), readyToShip: Boolean(raw.readyToShip), deliveryMethod: raw.deliveryMethod || '',
  };
}
async function readCatalog<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('The catalogue is temporarily unavailable. Please try again.');
  const result = await response.json();
  if (!result.success || !Array.isArray(result.data)) throw new Error('The catalogue is temporarily unavailable. Please try again.');
  return result.data;
}
export async function getCatalogProducts(): Promise<MensProduct[]> {
  return (await readCatalog<Record<string, any>[]>('products')).map(normalizeProduct);
}
export async function getCatalogCategories(): Promise<CatalogCategory[]> { return readCatalog<CatalogCategory[]>('categories'); }
export async function getCatalogProduct(id: string): Promise<MensProduct | undefined> {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error('The product is temporarily unavailable. Please try again.');
  return normalizeProduct((await response.json()).data);
}
