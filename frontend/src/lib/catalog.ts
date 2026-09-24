import { MENS_PRODUCTS, type MensProduct } from '../data/mensCollection';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeProduct(raw: Record<string, any>): MensProduct {
  const sizes = parseJson<string[]>(raw.sizes, ['38', '40', '42', '44', '46', '48']);
  const inStockSizes = parseJson<string[]>(raw.inStockSizes, ['38', '40', '42', '44', '46']);

  return {
    id: String(raw.id),
    title: raw.title,
    category: raw.categoryName || 'Sherwanis',
    price: Number(raw.price),
    salePrice: raw.salePrice ? Number(raw.salePrice) : null,
    sku: raw.sku,
    imageFront:
      raw.imageFront ||
      'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    imageDetail:
      raw.imageDetail ||
      'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw6c58fa09/images/hires/FW26/F26MP8SR_BEIGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
    color: raw.color || 'Beige',
    colorHex: raw.colorHex || '#D6C7B2',
    craft: raw.craft || 'Imperial Metallic Zardozi & Resham',
    description: raw.description || '',
    badge: raw.badge || 'EXCLUSIVE',
    sizes,
    inStockSizes,
    readyToShip: Boolean(raw.readyToShip),
    styleNumber: raw.styleNumber,
    measurements: raw.measurements,
    fabricContent: raw.fabricContent,
    componentsCount: raw.componentsCount,
    setIncludes: raw.setIncludes,
    washCare: raw.washCare,
    countryOfOrigin: raw.countryOfOrigin,
    manufacturerAddress: raw.manufacturerAddress,
    returnsPolicy: raw.returnsPolicy,
    disclaimer: raw.disclaimer,
    editorialStory: raw.editorialStory,
    styleNote: raw.styleNote,
    deliveryMethod: raw.deliveryMethod || 'both',
    colorVariants: parseJson(raw.colorVariants, raw.colorVariants),
    gallery: parseJson<string[]>(raw.gallery, []),
  };
}

export async function getCatalogProducts(): Promise<MensProduct[]> {
  const products = new Map<string, MensProduct>(MENS_PRODUCTS.map((product) => [product.id, product]));

  try {
    const response = await fetch(`${API_BASE_URL}/products`, { cache: 'force-cache' });
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json?.data)) {
        json.data.forEach((product: Record<string, any>) => {
          products.set(String(product.id), normalizeProduct(product));
        });
      }
    }
  } catch {
    // Keep the local catalog fallback when the backend is unavailable at build time.
  }

  return Array.from(products.values());
}

export async function getCatalogProduct(id: string): Promise<MensProduct | undefined> {
  const products = await getCatalogProducts();
  return products.find((product) => product.id === id);
}
