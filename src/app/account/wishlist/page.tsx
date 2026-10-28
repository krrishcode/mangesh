import { WishlistView } from '@/react/user/components/views/WishlistView';

export const metadata = {
  title: 'Wishlist | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountWishlistRoute() {
  return <WishlistView />;
}
