import { CartPage } from '@/components/CartPage';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Shopping Bag | Mangesh Mahadev',
  description: 'Review your shopping bag and proceed to checkout.',
};

export default function CartRoute() {
  return (
    <>
      <HeaderInteractive />
      <CartPage />
      <Footer />
    </>
  );
}
