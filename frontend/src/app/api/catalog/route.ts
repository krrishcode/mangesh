import { getCatalogProducts } from '@/lib/catalog';

export async function GET() {
  return Response.json({ products: await getCatalogProducts() });
}
