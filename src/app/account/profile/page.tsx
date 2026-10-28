import { ProfileView } from '@/react/user/components/views/ProfileView';

export const metadata = {
  title: 'Profile & Measurements | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountProfileRoute() {
  return <ProfileView />;
}
