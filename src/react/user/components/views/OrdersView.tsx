'use client';
import Link from 'next/link';
import { useState } from 'react';
import { accountApi, useAccountData } from '../../useAccountData';
import { dateLabel, money, type AccountOrder } from '../../account';
import { AccountDialog, AccountEmpty, AccountError, AccountFeedback, AccountLoading } from '../ui/AccountElements';
import { StatusBadge } from '../ui/StatusBadge';
import { GuestOrders } from '../../../../components/GuestOrders';
import { AccountIcon } from '../ui/AccountIcon';
import { AccountContactLink } from '../ui/AccountContact';
export function OrdersView() {
  const { data, loading, error, refreshError, reload } = useAccountData<AccountOrder[]>('/orders');
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState<AccountOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [cancelError, setCancelError] = useState('');
  async function cancel() {
    if (!cancelling) return; setSaving(true); setCancelError('');
    try { await accountApi(`/orders/${cancelling.id}/cancel`, { method: 'PATCH' }); setCancelling(null); setFeedback('Order cancelled.'); reload(); }
    catch (reason) { setCancelError(reason instanceof Error ? reason.message : 'Unable to cancel this order.'); }
    finally { setSaving(false); }
  }
  if (loading) return <AccountLoading />;
  if (error) return <AccountError retry={reload} />;
  if (!data?.length) return <div className="account-stack">{refreshError && <AccountError retry={reload} />}<AccountEmpty title="Your next favourite starts here"><p>Your purchases and delivery updates will appear here. Guest purchases from this browser are listed below.</p><Link href="/shop" className="account-button">Explore the collection <AccountIcon name="arrow" /></Link><button className="account-button secondary" onClick={reload}>Refresh orders</button></AccountEmpty><div className="account-guest-orders"><GuestOrders compact /></div></div>;
  const orders = data.filter(order => filter === 'all' || order.status === filter);
  return <div className="account-stack"><AccountFeedback message={feedback} />
    {refreshError && <AccountFeedback message="Your orders could not be refreshed. Showing your last loaded orders." error />}
    <div className="account-toolbar"><p className="account-muted">{data.length} {data.length === 1 ? 'order' : 'orders'} in your history</p><div className="account-toolbar-actions"><button type="button" className="account-link" onClick={reload}><AccountIcon name="refresh" />Refresh</button><label className="account-filter">Status<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All orders</option>{['pending','processing','shipped','delivered','cancelled'].map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select></label></div></div>
    {!orders.length && <AccountEmpty title="No matching orders"><p>Choose another status to view your purchases.</p><button className="account-button secondary" onClick={() => setFilter('all')}>Show all orders</button></AccountEmpty>}
    {orders.map(order => <article className="account-panel account-order" key={order.id}>
      <div className="account-order-header"><div><h2>{order.order_number}</h2><p className="account-muted">Placed {dateLabel(order.created_at)}</p></div><StatusBadge status={order.status} /></div>
      <div className="account-order-meta"><p>{order.items_count} {order.items_count === 1 ? 'item' : 'items'}</p><p>Total <strong>{money(order.total_amount)}</strong></p></div>
      {order.payment_method === 'cod' && <p className="account-muted">{order.fulfilment === 'pickup' ? 'Pay at collection' : 'Cash on delivery'}{order.payment_status === 'pending' && order.status !== 'cancelled' ? ' · Payment due' : order.payment_status === 'paid' ? ' · Paid' : ''}</p>}
      {order.items.some(item => item.image_url) && <div className="account-order-preview">{order.items.filter(item => item.image_url).slice(0, 4).map(item => <img key={item.id} src={item.image_url!} alt={item.title} loading="lazy" width={60} height={76} />)}{order.items.filter(item => item.image_url).length > 4 && <span>+{order.items.filter(item => item.image_url).length - 4}</span>}</div>}
      <details className="account-order-details"><summary>Items, delivery & tracking<AccountIcon name="plus" /></summary>
        <div className="account-order-items">{order.items?.length ? order.items.map(item => <div key={item.id}><div>{item.product_id ? <Link href={`/products/${item.product_id}`}>{item.title}</Link> : <p>{item.title}</p>}<span>{[item.color, item.size && `Size ${item.size}`, `Quantity ${item.quantity}`].filter(Boolean).join(' · ')}</span></div><p>{money(item.price * item.quantity)}</p></div>) : <p className="account-muted">Contact customer care for item details.</p>}</div>
        {order.shipping_address && <div className="account-stack"><h3>Delivery address</h3><address className="account-address-lines"><strong>{order.shipping_address.fullName}</strong><span>{order.shipping_address.line1}</span>{order.shipping_address.line2 && <span>{order.shipping_address.line2}</span>}<span>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</span><span>{order.shipping_address.country}</span></address></div>}
        {order.fulfilment === 'pickup' && <p className="account-muted">Store collection. Our team will contact you to arrange collection.</p>}
        {order.shipments?.map((shipment, index) => <div className="account-shipment" key={shipment.tracking_number || index}><h3>{shipment.carrier || 'Delivery update'}</h3><p className="account-muted">{shipment.status.replaceAll('_', ' ')}</p>{shipment.tracking_number && <p>Tracking number: {shipment.tracking_number}</p>}<p className="account-muted">Updated {dateLabel(shipment.updated_at)}</p></div>)}
        <div className="account-card-actions"><Link href={`/checkout/confirmation/${order.id}`} className="account-link">Open order summary</Link><AccountContactLink subject={`Order ${order.order_number}`}>Get help with this order</AccountContactLink>{order.status === 'pending' && order.payment_method === 'cod' && order.payment_status !== 'paid' && <button className="account-link account-danger" onClick={() => { setCancelError(''); setCancelling(order); }}>Cancel order</button>}</div>
      </details>
    </article>)}
    <div className="account-guest-orders"><GuestOrders compact /></div>
    {cancelling && <AccountDialog title={`Cancel ${cancelling.order_number}?`} busy={saving} onClose={() => setCancelling(null)}><p>This order will be cancelled. You can place a new order if you change your mind.</p><AccountFeedback message={cancelError} error /><div className="account-form-actions"><button className="account-button danger" disabled={saving} onClick={cancel}>{saving ? 'Cancelling…' : 'Cancel order'}</button><button className="account-button secondary" disabled={saving} onClick={() => setCancelling(null)}>Keep order</button></div></AccountDialog>}
  </div>;
}
