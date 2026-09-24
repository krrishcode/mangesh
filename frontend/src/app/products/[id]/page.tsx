import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import { ProductDetailView } from '@/components/ProductDetailView';
import Footer from '@/components/Footer';
import { getCatalogProduct, getCatalogProducts } from '@/lib/catalog';

export const dynamicParams = false;

type ProductRouteProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const products = await getCatalogProducts();
  return products.map((product) => ({ id: product.id }));
}

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
  const product = await getCatalogProduct(id);

  if (!product) notFound();

  return (
    <>
      <HeaderInteractive />
      <main id="main">
        <ProductDetailView product={product} />
      </main>
      <Footer />
    </>
  );
}
