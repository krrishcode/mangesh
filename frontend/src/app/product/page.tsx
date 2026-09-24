import { HeaderInteractive } from '@/components/HeaderInteractive';
import { ProductDetailView } from '@/components/ProductDetailView';
import Footer from '@/components/Footer';
import { MENS_PRODUCTS } from '@/data/mensCollection';

const product = MENS_PRODUCTS[0];

export const metadata = {
  title: `${product.title} | Mangesh Mahadev Haute Couture`,
  description: product.description,
};

export default function ProductRoute() {
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
