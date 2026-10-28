import { OverviewView } from '@/react/user/components/views/OverviewView';

export const metadata = {
  title: 'My Account | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountOverviewRoute() {
  return <OverviewView />;
}
