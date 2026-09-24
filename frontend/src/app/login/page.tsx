import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { LoginPage } from '@/react/auth/pages/LoginPage';

export const metadata = { title: 'Login | Mangesh Mahadev' };

export default function LoginRoute() {
  return (
    <>
      <HeaderInteractive />
      <LoginPage />
      <Footer />
    </>
  );
}
