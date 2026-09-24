import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { UserPortalLayout } from '@/react/user/components/UserPortalLayout';
import { AddressesView } from '@/react/user/components/views/AddressesView';

export const metadata = {
  title: 'Address Book | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountAddressesRoute() {
  return (
    <>
      <HeaderInteractive />
      <main className="bg-[#FAF8F5] min-h-screen pt-8 pb-20">
        <UserPortalLayout activeTab="addresses">
          <AddressesView />
        </UserPortalLayout>
      </main>
      <Footer />
    </>
  );
}



