import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { RegisterPage } from '@/react/auth/pages/RegisterPage';

export const metadata = { title: 'Create Account | Mangesh Mahadev' };

export default function RegisterRoute() {
  return (
    <>
      <HeaderInteractive />
      <RegisterPage />
      <Footer />
    </>
  );
}
