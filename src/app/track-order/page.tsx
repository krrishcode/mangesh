import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { GuestOrders } from '@/components/GuestOrders';
export const metadata = { title: 'Guest orders | Mangesh Mahadev', robots: { index: false } };
export default function Page() { return <><HeaderInteractive /><main id="main" className="commerce-shell"><h1>Your orders</h1><GuestOrders /></main><Footer /></>; }
