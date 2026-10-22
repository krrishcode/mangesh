'use client';

import Link from 'next/link';
import { useAuthStore } from '../../../../stores/authStore';
import { useAccountData } from '../../useAccountData';
import { dateLabel, money, type AccountOrder, type Appointment, type Address } from '../../account';
import { AccountLoading, AccountError } from '../ui/AccountElements';
import { StatusBadge } from '../ui/StatusBadge';

export function OverviewView() {
  const user = useAuthStore((state) => state.user);
  const orders = useAccountData<AccountOrder[]>('/orders');
  const appointments = useAccountData<Appointment[]>('/appointments');
  const addresses = useAccountData<Address[]>('/users/me/addresses');
  const latestOrder = orders.data?.[0];
  const nextAppointment = appointments.data?.filter((item) => item.status === 'upcoming' && new Date(item.scheduled_at).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
  const address = addresses.data?.find((item) => item.isDefault && item.label === 'shipping') || addresses.data?.find((item) => item.label === 'shipping');
  return <div className="account-overview-grid">
    <nav className="account-shortcuts" aria-label="Manage your account"><Link href="/account/orders"><span>Purchases</span><strong>Orders & tracking</strong></Link><Link href="/account/wishlist"><span>Saved pieces</span><strong>Your wishlist</strong></Link><Link href="/account/addresses"><span>Delivery</span><strong>Address book</strong></Link></nav>
    <section className="account-panel account-summary-panel">
      <header className="account-panel-heading"><h2>Latest order</h2><Link href="/account/orders" className="account-link">View all</Link></header>
      {orders.loading ? <AccountLoading /> : orders.error ? <AccountError retry={orders.reload} /> : latestOrder ? <>
        <div className="account-summary-top"><h3>{latestOrder.order_number}</h3><StatusBadge status={latestOrder.status} /></div>
        <p className="account-muted">{dateLabel(latestOrder.created_at)} · {latestOrder.items_count} {latestOrder.items_count === 1 ? 'item' : 'items'}</p>
        <p className="account-summary-value">{money(latestOrder.total_amount)}</p>
        <Link href="/account/orders" className="account-link account-summary-action">View order details</Link>
      </> : <div className="account-summary-empty"><h3>No orders yet</h3><p>Your purchases will appear here.</p><Link href="/shop" className="account-link">Browse clothing</Link></div>}
    </section>
    <section className="account-panel account-summary-panel">
      <header className="account-panel-heading"><h2>Next appointment</h2><Link href="/account/appointments" className="account-link">Manage</Link></header>
      {appointments.loading ? <AccountLoading /> : appointments.error ? <AccountError retry={appointments.reload} /> : nextAppointment ? <>
        <div className="account-summary-top"><h3>{nextAppointment.location}</h3><StatusBadge status={nextAppointment.status} /></div>
        <p className="account-muted">{nextAppointment.occasion}</p><p className="account-summary-value appointment-date">{dateLabel(nextAppointment.scheduled_at, true)}</p><p className="account-muted">India Standard Time</p>
        <Link href="/account/appointments" className="account-link account-summary-action">Appointment details</Link>
      </> : <div className="account-summary-empty"><h3>No upcoming appointments</h3><p>Arrange a visit for sizing or styling.</p><Link href="/account/appointments" className="account-link">Book an appointment</Link></div>}
    </section>
    <section className="account-panel">
      <header className="account-panel-heading"><h2>Personal details</h2><Link href="/account/profile" className="account-link">Edit</Link></header>
      <dl className="account-detail-list"><div><dt>Name</dt><dd>{user?.name}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Phone</dt><dd>{user?.phone || 'Not added'}</dd></div></dl>
    </section>
    <section className="account-panel">
      <header className="account-panel-heading"><h2>Delivery address</h2><Link href="/account/addresses" className="account-link">Manage</Link></header>
      {addresses.loading ? <AccountLoading /> : addresses.error ? <AccountError retry={addresses.reload} /> : address ? <address className="account-address-lines"><strong>{address.fullName}</strong><span>{address.line1}</span>{address.line2 && <span>{address.line2}</span>}<span>{address.city}, {address.state} {address.postalCode}</span><span>{address.country}</span></address> : <div className="account-summary-empty"><h3>No saved delivery address</h3><p>Add an address for your next order.</p><Link href="/account/addresses" className="account-link">Add an address</Link></div>}
    </section>
    <div className="account-help-row"><div><h2>Here to help</h2><p>Questions about an order, a fitting or a product?</p></div><a href="mailto:care@shrutimangesh.com" className="account-link">Contact customer care</a></div>
  </div>;
}
