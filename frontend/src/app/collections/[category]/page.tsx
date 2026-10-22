import { notFound } from 'next/navigation';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import { ShopListingView } from '@/components/ShopListingView';
import Footer from '@/components/Footer';
import { getCatalogProducts, getCatalogCategories } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const item = (await getCatalogCategories()).find(item => item.slug === category);
  return { title: `${item?.name || 'Collection'} | Mangesh Mahadev` };
}
export default async function CollectionRoute({ params }: Props) {
  const { category } = await params;
  const [categories, products] = await Promise.all([getCatalogCategories(), getCatalogProducts()]);
  const selected = categories.find(item => item.slug === category);
  if (!selected) notFound();
  return <><HeaderInteractive /><main className="min-h-screen"><ShopListingView key={category} products={products} initialCategory={selected.name} /></main><Footer /></>;
}
