import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { UserPortalLayout } from '@/react/user/components/UserPortalLayout';
import { WishlistView } from '@/react/user/components/views/WishlistView';

export const metadata = {
  title: 'Wishlist | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountWishlistRoute() {
  return (
    <>
      <HeaderInteractive />
      <main className="bg-[#FAF8F5] min-h-screen pt-8 pb-20">
        <UserPortalLayout activeTab="wishlist">
          <WishlistView />
        </UserPortalLayout>
      </main>
      <Footer />
    </>
  );
}



