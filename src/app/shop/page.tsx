import { HeaderInteractive } from '@/components/HeaderInteractive';
import { ShopListingView } from '@/components/ShopListingView';
import Footer from '@/components/Footer';
import { getCatalogProducts } from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Men's Clothing | Mangesh Mahadev",
  description:
    'Shop sherwanis, bandhgalas, kurtas, Nehru jackets and trousers from Mangesh Mahadev.',
};

export default async function ShopPage() {
  const products = await getCatalogProducts();

  return (
    <>
      <HeaderInteractive />
      <main className="min-h-screen">
        <ShopListingView products={products} />
      </main>
      <Footer />
    </>
  );
}
