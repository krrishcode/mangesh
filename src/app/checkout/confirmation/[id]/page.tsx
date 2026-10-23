import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { OrderConfirmation } from '@/components/OrderConfirmation';
export const metadata = { title: 'Order confirmation | Mangesh Mahadev' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><HeaderInteractive /><OrderConfirmation id={id} /><Footer compact /></>;
}
