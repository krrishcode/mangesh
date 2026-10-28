import { OrdersView } from '@/react/user/components/views/OrdersView';

export const metadata = {
  title: 'Order History | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountOrdersRoute() {
  return <OrdersView />;
}
