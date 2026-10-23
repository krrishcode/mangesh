import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { UserPortalLayout } from '@/react/user/components/UserPortalLayout';
import { ProfileView } from '@/react/user/components/views/ProfileView';

export const metadata = {
  title: 'Profile & Measurements | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountProfileRoute() {
  return (
    <>
      <HeaderInteractive />
      <main id="main" className="bg-[#FAF8F5] min-h-[65vh]">
        <UserPortalLayout activeTab="profile">
          <ProfileView />
        </UserPortalLayout>
      </main>
      <Footer compact />
    </>
  );
}
