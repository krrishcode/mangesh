import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import { ShopListingView } from '@/components/ShopListingView';
import Footer from '@/components/Footer';

const CATEGORY_MAP = {
  sherwanis: 'Sherwanis',
  bandhgalas: 'Bandhgalas',
  kurtas: 'Kurtas',
  'nehru-jackets': 'Nehru Jackets',
  trousers: 'Trousers',
  shackets: 'Shackets',
  accessories: 'Accessories',
} as const;

type CollectionRouteProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((category) => ({ category }));
}

export async function generateMetadata({ params }: CollectionRouteProps): Promise<Metadata> {
  const { category } = await params;
  const categoryName = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];

  return {
    title: categoryName
      ? `${categoryName.toUpperCase()} | Mangesh Mahadev Haute Couture`
      : 'Collection | Mangesh Mahadev Haute Couture',
    description: categoryName
      ? `Discover handcrafted luxury ${categoryName} designed for royal celebrations and wedding ceremonies.`
      : undefined,
  };
}

export default async function CollectionRoute({ params }: CollectionRouteProps) {
  const { category } = await params;
  const categoryName = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];

  if (!categoryName) notFound();

  return (
    <>
      <HeaderInteractive />
      <main className="min-h-screen">
        <ShopListingView key={category} initialCategory={categoryName} />
      </main>
      <Footer />
    </>
  );
}
