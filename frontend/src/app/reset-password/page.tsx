import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { ResetPasswordPage } from '@/react/auth/pages/ResetPasswordPage';

export const metadata = { title: 'Reset Password | Mangesh Mahadev' };

export default function ResetPasswordRoute() {
  return (
    <>
      <HeaderInteractive />
      <ResetPasswordPage />
      <Footer />
    </>
  );
}
