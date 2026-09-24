import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { ForgotPasswordPage } from '@/react/auth/pages/ForgotPasswordPage';

export const metadata = { title: 'Forgot Password | Mangesh Mahadev' };

export default function ForgotPasswordRoute() {
  return (
    <>
      <HeaderInteractive />
      <ForgotPasswordPage />
      <Footer />
    </>
  );
}
