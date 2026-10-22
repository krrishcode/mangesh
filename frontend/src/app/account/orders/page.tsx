import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { UserPortalLayout } from '@/react/user/components/UserPortalLayout';
import { OrdersView } from '@/react/user/components/views/OrdersView';

export const metadata = {
  title: 'Order History | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountOrdersRoute() {
  return (
    <>
      <HeaderInteractive />
      <main id="main" className="bg-[#FAF8F5] min-h-[65vh]">
        <UserPortalLayout activeTab="orders">
          <OrdersView />
        </UserPortalLayout>
      </main>
      <Footer compact />
    </>
  );
}
