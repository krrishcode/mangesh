import { HeaderInteractive } from '@/components/HeaderInteractive';
import { ShopListingView } from '@/components/ShopListingView';
import Footer from '@/components/Footer';

export const metadata = {
  title: "MEN'S CLOTHING | View All Haute Couture & Heritage | MANGESH MAHADEV",
  description:
    'Explore the complete collection of royal Sherwanis, Imperial Bandhgalas, Heritage Kurtas, Nehru Jackets, and bespoke Groomswear from Mangesh Mahadev.',
};

export default function ShopPage() {
  return (
    <>
      <HeaderInteractive />
      <main className="min-h-screen">
        <ShopListingView />
      </main>
      <Footer />
    </>
  );
}
