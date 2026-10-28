'use client';
import { SupportEmailLink } from './SupportEmailLink';
import Link from 'next/link';
import { useAccountData } from '../react/user/useAccountData';
import { type AccountOrder, money, dateLabel } from '../react/user/account';
import '../styles/commerce.css';
export function GuestOrders({ compact = false }: { compact?: boolean }) {
  const { data, loading, error, reload } = useAccountData<AccountOrder[]>('/checkout/guest/orders');
  if (compact && !loading && !error && !data?.length) return null;
  return <section className="commerce-panel commerce-stack"><div><h2>{compact ? 'Bought as a guest?' : 'Guest orders'}</h2><p className="commerce-form-note">Orders placed on this browser are available here for 30 days. Sign in and open an order to add it to your account.</p></div>
    {loading ? <p role="status">Loading guest orders…</p> : error ? <div role="alert"><p>Guest orders could not be loaded. Please try again.</p><button className="commerce-link" onClick={reload}>Try again</button></div> : !data?.length ? <div><p>No guest orders are available on this browser.</p><p className="commerce-form-note">If you used another browser or cleared cookies, contact customer care with your order number.</p></div> : data.map(order => <article key={order.id} className="guest-order-row"><div><h3>{order.order_number}</h3><p>{dateLabel(order.created_at)} · {order.status}</p></div><span>{money(order.total_amount)}</span><Link className="commerce-link" href={`/checkout/confirmation/${order.id}?guest=1`}>View order</Link></article>)}
    {!compact && <div className="commerce-confirm-actions"><Link href="/login?next=/account/orders" className="commerce-button">Sign in to my account</Link><SupportEmailLink className="commerce-link">Contact customer care</SupportEmailLink></div>}
  </section>;
}
