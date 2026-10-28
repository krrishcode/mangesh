import { AddressesView } from '@/react/user/components/views/AddressesView';

export const metadata = {
  title: 'Address Book | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountAddressesRoute() {
  return <AddressesView />;
}
