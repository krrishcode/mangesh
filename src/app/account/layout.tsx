import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { UserPortalLayout } from '@/react/user/components/UserPortalLayout';

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>
    <HeaderInteractive />
    <main id="main" className="bg-white min-h-[65vh]">
      <UserPortalLayout>{children}</UserPortalLayout>
    </main>
    <Footer />
  </>;
}
