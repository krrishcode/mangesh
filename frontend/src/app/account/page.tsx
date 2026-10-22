import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { UserPortalLayout } from '@/react/user/components/UserPortalLayout';
import { OverviewView } from '@/react/user/components/views/OverviewView';

export const metadata = {
  title: 'My Account | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountOverviewRoute() {
  return (
    <>
      <HeaderInteractive />
      <main id="main" className="bg-[#FAF8F5] min-h-[65vh]">
        <UserPortalLayout activeTab="overview">
          <OverviewView />
        </UserPortalLayout>
      </main>
      <Footer compact />
    </>
  );
}
