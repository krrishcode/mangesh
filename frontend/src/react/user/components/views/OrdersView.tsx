'use client';
import Link from 'next/link';
import { useState } from 'react';
import { accountApi, useAccountData } from '../../useAccountData';
import { dateLabel, money, type AccountOrder } from '../../account';
import { AccountDialog, AccountEmpty, AccountError, AccountFeedback, AccountLoading } from '../ui/AccountElements';
import { StatusBadge } from '../ui/StatusBadge';
import { GuestOrders } from '../../../../components/GuestOrders';
export function OrdersView() {
  const { data, loading, error, reload } = useAccountData<AccountOrder[]>('/orders');
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
  if (!data?.length) return <div className="account-stack"><AccountEmpty title="No orders yet"><p>Your order history and delivery updates will appear here.</p><Link href="/shop" className="account-button">Browse clothing</Link></AccountEmpty><GuestOrders compact /></div>;
  const orders = data.filter(order => filter === 'all' || order.status === filter);
  return <div className="account-stack"><AccountFeedback message={feedback} />
    <div className="account-toolbar"><p className="account-muted">{data.length} {data.length === 1 ? 'order' : 'orders'}</p><label className="account-filter">Status<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All orders</option>{['pending','processing','shipped','delivered','cancelled'].map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select></label></div>
    {!orders.length && <AccountEmpty title="No matching orders"><p>Choose another status to view your purchases.</p><button className="account-button secondary" onClick={() => setFilter('all')}>Show all orders</button></AccountEmpty>}
    {orders.map(order => <article className="account-panel account-order" key={order.id}>
      <div className="account-order-header"><div><h2>{order.order_number}</h2><p className="account-muted">Placed {dateLabel(order.created_at)}</p></div><StatusBadge status={order.status} /></div>
      <div className="account-order-meta"><p>{order.items_count} {order.items_count === 1 ? 'item' : 'items'}</p><p>Total <strong>{money(order.total_amount)}</strong></p></div>
      {order.payment_method === 'cod' && <p className="account-muted">{order.fulfilment === 'pickup' ? 'Pay at collection' : 'Cash on delivery'}{order.payment_status === 'pending' && order.status !== 'cancelled' ? ' · Payment due' : order.payment_status === 'paid' ? ' · Paid' : ''}</p>}
      <details className="account-order-details"><summary>View order details<span aria-hidden="true">+</span></summary>
        <div className="account-order-items">{order.items?.length ? order.items.map(item => <div key={item.id}><div>{item.product_id ? <Link href={`/products/${item.product_id}`}>{item.title}</Link> : <p>{item.title}</p>}<span>{[item.color, item.size && `Size ${item.size}`, `Quantity ${item.quantity}`].filter(Boolean).join(' · ')}</span></div><p>{money(item.price * item.quantity)}</p></div>) : <p className="account-muted">Contact customer care for item details.</p>}</div>
        {order.shipping_address && <div className="account-stack"><h3>Delivery address</h3><address className="account-address-lines"><strong>{order.shipping_address.fullName}</strong><span>{order.shipping_address.line1}</span>{order.shipping_address.line2 && <span>{order.shipping_address.line2}</span>}<span>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</span><span>{order.shipping_address.country}</span></address></div>}
        {order.shipments?.map((shipment, index) => <div className="account-panel" key={shipment.tracking_number || index}><h3>{shipment.carrier || 'Delivery update'}</h3><p className="account-muted">{shipment.status.replaceAll('_', ' ')}</p>{shipment.tracking_number && <p>Tracking number: {shipment.tracking_number}</p>}<p className="account-muted">Updated {dateLabel(shipment.updated_at)}</p></div>)}
        <div className="account-card-actions"><a href={`mailto:care@shrutimangesh.com?subject=${encodeURIComponent(`Order ${order.order_number}`)}`} className="account-link">Get help with this order</a>{order.status === 'pending' && order.payment_method === 'cod' && order.payment_status !== 'paid' && <button className="account-link" onClick={() => { setCancelError(''); setCancelling(order); }}>Cancel order</button>}</div>
      </details>
    </article>)}
    <GuestOrders compact />
    {cancelling && <AccountDialog title={`Cancel ${cancelling.order_number}?`} onClose={() => { if (!saving) setCancelling(null); }}><p>This order will be cancelled. You can place a new order if you change your mind.</p><AccountFeedback message={cancelError} error /><div className="account-form-actions"><button className="account-button" disabled={saving} onClick={cancel}>{saving ? 'Cancelling…' : 'Cancel order'}</button><button className="account-button secondary" disabled={saving} onClick={() => setCancelling(null)}>Keep order</button></div></AccountDialog>}
  </div>;
}
