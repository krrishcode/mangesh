'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { accountApi, useAccountData } from '../react/user/useAccountData';
import { type AccountOrder, money, dateLabel } from '../react/user/account';
import '../styles/order-confirmation.css';

const icons = {
  check: 'm5 12 4 4L19 6', arrow: 'M4 12h16m-6-6 6 6-6 6',
  bag: 'M8 8V6a4 4 0 0 1 8 0v2M5 8h14l1 13H4L5 8Z', copy: 'M9 9h11v12H9zM5 15H3V3h11v2',
  print: 'M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7zM17 11h.01', close: 'm6 6 12 12M6 18 18 6',
  delivery: 'M1 5h14v12H1zM15 9h4l4 4v4h-8M7 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0M21 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  location: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  payment: 'M3 5h18v14H3zM3 10h18M7 15h3', help: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};
function Icon({ name, className = '' }: { name: keyof typeof icons; className?: string }) {
  return <svg className={`confirmation-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>;
}
function ReceiptLoading() {
  return <div className="confirmation-loading" role="status" aria-label="Loading your order"><div /><span /><span /><section><div /><div /></section><p>Retrieving your order details…</p></div>;
}
export function OrderConfirmation({ id }: { id: string }) {
  const token = useAuthStore(state => state.token);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [guest, setGuest] = useState(false);
  useEffect(() => { setGuest(new URLSearchParams(window.location.search).get('guest') === '1'); setHydrated(true); }, [id]);
  useEffect(() => { if (hydrated && !guest && !token) router.replace('/login?next=' + encodeURIComponent(`/checkout/confirmation/${id}`)); }, [hydrated, guest, token, id, router]);
  return <main id="main" className="order-confirmation">{!hydrated || (!guest && !token) ? <ReceiptLoading /> : <Receipt id={id} guest={guest} onClaimed={() => setGuest(false)} />}</main>;
}
function Receipt({ id, guest, onClaimed }: { id: string; guest: boolean; onClaimed: () => void }) {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const [claiming, setClaiming] = useState(false);
  const [actionError, setActionError] = useState('');
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const { data: order, loading, error, reload } = useAccountData<AccountOrder>(guest ? `/checkout/guest/orders/${id}` : `/orders/${id}`);
  async function claim() {
    setClaiming(true); setActionError('');
    try { await accountApi(`/checkout/guest/orders/${id}/claim`, { method: 'POST' }); onClaimed(); router.replace(`/checkout/confirmation/${id}`, { scroll: false }); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to save this order. Please try again.'); }
    finally { setClaiming(false); }
  }
  async function cancel() {
    setCancelling(true); setActionError('');
    try { await accountApi(`/checkout/guest/orders/${id}/cancel`, { method: 'PATCH' }); setCancelPrompt(false); reload(); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to cancel this order. Please try again.'); }
    finally { setCancelling(false); }
  }
  async function copyOrderNumber(number: string) {
    try { await navigator.clipboard.writeText(number); setCopyMessage('Order number copied'); }
    catch { setCopyMessage('Select the order number to copy it.'); }
  }
  if (loading) return <ReceiptLoading />;
  if (error || !order) return <section className="confirmation-error" role="alert"><Icon name="bag" /><h1>Your order details are unavailable.</h1><p>Please try again to retrieve your order summary.</p><div className="confirmation-actions"><button className="confirmation-button" onClick={reload}>Try again</button><Link className="confirmation-button secondary" href={guest ? '/track-order' : '/account/orders'}>View your orders</Link></div></section>;

  const address = order.shipping_address;
  const pickup = order.fulfilment === 'pickup';
  const cancelled = order.status === 'cancelled';
  const delivered = order.status === 'delivered';
  const paymentDue = order.payment_status === 'pending' && !cancelled;
  const paymentLabel = order.payment_method === 'cod' ? (pickup ? 'Pay at collection' : 'Cash on delivery') : order.payment_method || 'Contact customer care';
  const stages = ['Order placed', 'Preparing your order', pickup ? 'Ready for collection' : 'On its way', pickup ? 'Collected' : 'Delivered'];
  const stage = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
  const canCancel = guest && order.guest && order.status === 'pending' && order.payment_method === 'cod' && order.payment_status !== 'paid';
  return <div className="confirmation-container">
    <div className="confirmation-topbar"><Link href="/shop">Continue exploring <Icon name="arrow" /></Link><button className="confirmation-print" onClick={() => window.print()}><Icon name="print" />Print summary</button></div>
    <header className={`confirmation-intro${cancelled ? ' is-cancelled' : ''}`}>
      <div className="confirmation-intro-main"><span className="confirmation-seal"><Icon name={cancelled ? 'close' : 'check'} /></span><div><h1>{cancelled ? 'Your order is cancelled.' : delivered ? (pickup ? 'Your order is collected.' : 'Your order has arrived.') : 'Thank you for your order.'}</h1><p>{cancelled ? 'This order will no longer be fulfilled. You can find its details below.' : delivered ? 'We hope you love your new pieces. Your order details are here whenever you need them.' : 'Your order has been placed. Every detail, all in one place.'}</p></div></div>
      <div className="confirmation-reference"><div className="confirmation-order-number"><span>{order.order_number}</span><button onClick={() => copyOrderNumber(order.order_number)} aria-label="Copy order number" title="Copy order number"><Icon name={copyMessage === 'Order number copied' ? 'check' : 'copy'} /></button></div><p>Placed on {dateLabel(order.created_at)}</p><span className="confirmation-copy-message" role="status">{copyMessage}</span></div>
    </header>
    {!cancelled && stage >= 0 && <ol className="confirmation-progress" aria-label="Order progress">{stages.map((label, index) => <li key={label} className={index < stage ? 'is-complete' : index === stage ? 'is-current' : ''} aria-current={index === stage ? 'step' : undefined}><span className="confirmation-step-dot">{index <= stage && <Icon name="check" />}</span><span>{label}{index <= stage && <small>{index < stage ? 'Completed' : 'Current status'}</small>}</span></li>)}</ol>}
    <div className="confirmation-layout"><div className="confirmation-main">
      <section className="confirmation-pieces" aria-labelledby="confirmation-pieces-heading"><header className="confirmation-section-heading"><h2 id="confirmation-pieces-heading">Your selection</h2><span>{itemCount} {itemCount === 1 ? 'piece' : 'pieces'}</span></header><div className="confirmation-item-list">{order.items.length ? order.items.map(item => <article key={item.id} className="confirmation-item"><div className="confirmation-item-image">{item.image_url ? <img src={item.image_url} alt={item.title} width={96} height={120} /> : <span><Icon name="bag" /><small>Image unavailable</small></span>}</div><div className="confirmation-item-info"><h3>{item.product_id ? <Link href={`/products/${item.product_id}`}>{item.title}</Link> : item.title}</h3><p>{[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' / ') || 'Details not provided'}</p><span>Quantity {item.quantity}</span></div><strong className="confirmation-item-price">{money(item.price * item.quantity)}</strong></article>) : <p className="confirmation-muted">Contact customer care for the items in this order.</p>}</div></section>
      <div className="confirmation-details"><section aria-labelledby="confirmation-delivery-heading"><h2 id="confirmation-delivery-heading"><Icon name={pickup ? 'location' : 'delivery'} />{pickup ? 'Store collection' : 'Delivery details'}</h2>{pickup ? <p>Our team will contact you to arrange collection.</p> : address ? <address><strong>{address.fullName}</strong><span>{address.line1}</span>{address.line2 && <span>{address.line2}</span>}<span>{address.city}, {address.state} {address.postalCode}</span><span>{address.country}</span>{address.phone && <span className="confirmation-address-phone">{address.phone}</span>}</address> : <p>Contact customer care for delivery information.</p>}</section><section aria-labelledby="confirmation-payment-heading"><h2 id="confirmation-payment-heading"><Icon name="payment" />Payment details</h2><p className="confirmation-payment-method">{paymentLabel}</p><span className={`confirmation-payment-status${order.payment_status === 'paid' ? ' is-paid' : ''}`}>{cancelled ? 'Order cancelled' : order.payment_status === 'paid' ? 'Payment received' : order.payment_status === 'refunded' ? 'Payment refunded' : paymentDue ? 'Payment due' : order.payment_status ? order.payment_status.replaceAll('_', ' ') : 'Payment status unavailable'}</span>{paymentDue && order.payment_method === 'cod' && <p className="confirmation-muted">{pickup ? 'Pay when you collect your order.' : 'Pay when your order is delivered.'}</p>}</section></div>
      {!!order.shipments?.length && <section className="confirmation-shipments"><h2>Shipment details</h2>{order.shipments.map((shipment, index) => <div key={index}><div><strong>{shipment.carrier || 'Delivery'}</strong><p>{shipment.status.replaceAll('_', ' ')}</p></div>{shipment.tracking_number && <span>Tracking: {shipment.tracking_number}</span>}</div>)}</section>}
      {guest && <section className="confirmation-guest"><div><h2>{order.guest ? 'Make it part of your account.' : 'This order is saved to your account.'}</h2><p>{order.guest ? 'Keep your purchases together and return to your order history whenever you need.' : 'You can find this purchase in your account order history.'}</p></div>{order.guest ? token ? <button className="confirmation-button secondary" disabled={claiming || cancelling} onClick={claim}>{claiming ? 'Saving order…' : 'Save to my account'}<Icon name="arrow" /></button> : <Link className="confirmation-button secondary" href={`/login?next=${encodeURIComponent(`/checkout/confirmation/${id}?guest=1`)}`}>Sign in or create account<Icon name="arrow" /></Link> : <Link className="confirmation-text-link" href="/account/orders">View account orders <Icon name="arrow" /></Link>}<p className="confirmation-guest-note">Save your order number. Guest orders are available on this browser for 30 days.</p></section>}
      {actionError && <p className="confirmation-action-error" role="alert">{actionError}</p>}
    </div>
    <aside className="confirmation-summary" aria-labelledby="confirmation-summary-heading"><h2 id="confirmation-summary-heading">Order summary</h2><dl>{order.subtotal != null && <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>}{order.shipping_amount != null && <div><dt>{pickup ? 'Collection' : 'Delivery'}</dt><dd>{order.shipping_amount === 0 ? 'No charge' : money(order.shipping_amount)}</dd></div>}<div className="confirmation-total"><dt>Total <span>INR</span></dt><dd>{money(order.total_amount)}</dd></div></dl>{paymentDue && <p className="confirmation-due-note"><Icon name="payment" />{pickup ? 'Payable at collection' : order.payment_method === 'cod' ? 'Payable on delivery' : 'Payment pending'}</p>}<div className="confirmation-actions"><Link href={guest ? '/track-order' : '/account/orders'} className="confirmation-button">{guest ? 'View guest orders' : 'View my orders'}<Icon name="arrow" /></Link><Link href="/shop" className="confirmation-button secondary">Continue shopping</Link></div><div className="confirmation-help"><Icon name="help" /><div><p>Here to help with your order.</p><a href={`mailto:care@shrutimangesh.com?subject=${encodeURIComponent(`Order ${order.order_number}`)}`}>Contact customer care</a></div></div>{canCancel && <div className="confirmation-cancel">{cancelPrompt ? <div role="group" aria-label="Confirm order cancellation"><p>Cancel {order.order_number}? This cannot be undone.</p><div><button className="confirmation-text-link" disabled={cancelling || claiming} onClick={cancel}>{cancelling ? 'Cancelling…' : 'Yes, cancel order'}</button><button className="confirmation-text-link" disabled={cancelling} onClick={() => setCancelPrompt(false)}>Keep order</button></div></div> : <button className="confirmation-text-link" disabled={claiming} onClick={() => setCancelPrompt(true)}>Cancel this order</button>}</div>}</aside>
    </div>
  </div>;
}
