import type { MensProduct } from '../data/mensCollection';

export const effectivePrice = (product: Pick<MensProduct, 'price' | 'salePrice'>) =>
  Number(product.salePrice) > 0 && Number(product.salePrice) < product.price ? Number(product.salePrice) : product.price;
export const formatPrice = (price: number) => price > 0
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)
  : 'Price on request';
export function stringArray(value: unknown): string[] {
  try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? [...new Set(parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0))] : []; }
  catch { return []; }
}
export function productVariants(product: MensProduct) {
  let raw: unknown = product.colorVariants;
  try { if (typeof raw === 'string') raw = JSON.parse(raw); } catch { raw = []; }
  const variants = Array.isArray(raw) ? raw.filter(v => v && typeof v.color === 'string') : [];
  return (variants.length ? variants : [{ color: product.color, colorHex: product.colorHex, imageFront: product.imageFront, sizes: product.sizes, inStockSizes: product.inStockSizes }]).map(v => {
    const sizes = stringArray(v.sizes);
    return { color: String(v.color), colorHex: typeof v.colorHex === 'string' ? v.colorHex : undefined,
      imageFront: typeof v.imageFront === 'string' ? v.imageFront : product.imageFront,
      sizes, inStockSizes: product.stock > 0 ? stringArray(v.inStockSizes).filter(size => sizes.includes(size)) : [] };
  });
}
