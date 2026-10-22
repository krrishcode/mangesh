import { getCatalogProducts, getCatalogCategories } from '@/lib/catalog';
export async function GET() {
  try {
    const [products, categories] = await Promise.all([getCatalogProducts(), getCatalogCategories()]);
    return Response.json({ products, categories }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'The catalogue is temporarily unavailable. Please try again.' }, { status: 503 }); }
}
