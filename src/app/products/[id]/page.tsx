import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import { ProductDetailView } from '@/components/ProductDetailView';
import Footer from '@/components/Footer';
import { getCatalogProduct, getCatalogProducts } from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

type ProductRouteProps = {
  params: Promise<{ id: string }>;
};



export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getCatalogProduct(id);

  return {
    title: product
      ? `${product.title} | Mangesh Mahadev Haute Couture`
      : 'Product | Mangesh Mahadev Haute Couture',
    description: product?.description,
  };
}

export default async function ProductDetailRoute({ params }: ProductRouteProps) {
  const { id } = await params;
  const [product, products] = await Promise.all([
    getCatalogProduct(id),
    getCatalogProducts(),
  ]);

  if (!product) notFound();

  return (
    <>
      <HeaderInteractive />
      <main id="main">
        <ProductDetailView key={product.id} product={product} relatedProducts={
          products.filter((item) => item.id !== product.id)
            .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
            .slice(0, 4)
        } />
      </main>
      <Footer />
    </>
  );
}
