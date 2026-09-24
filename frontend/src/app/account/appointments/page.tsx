import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { UserPortalLayout } from '@/react/user/components/UserPortalLayout';
import { AppointmentsView } from '@/react/user/components/views/AppointmentsView';

export const metadata = {
  title: 'Appointments | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountAppointmentsRoute() {
  return (
    <>
      <HeaderInteractive />
      <main className="bg-[#FAF8F5] min-h-screen pt-8 pb-20">
        <UserPortalLayout activeTab="appointments">
          <AppointmentsView />
        </UserPortalLayout>
      </main>
      <Footer />
    </>
  );
}



