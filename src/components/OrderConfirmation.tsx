'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { accountApi, useAccountData } from '../react/user/useAccountData';
import { type AccountOrder, money, dateLabel } from '../react/user/account';
import '../styles/commerce.css';
export function OrderConfirmation({ id }: { id: string }) {
  const token = useAuthStore(state => state.token);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [guest, setGuest] = useState(false);
  useEffect(() => { setGuest(new URLSearchParams(window.location.search).get('guest') === '1'); setHydrated(true); }, []);
  useEffect(() => { if (hydrated && !guest && !token) router.replace('/login?next=' + encodeURIComponent(`/checkout/confirmation/${id}`)); }, [hydrated, guest, token, id, router]);
  return <main id="main" className="commerce-shell">{!hydrated || (!guest && !token) ? <p role="status">Loading your order…</p> : <Receipt id={id} guest={guest} />}</main>;
}
function Receipt({ id, guest }: { id: string; guest: boolean }) {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { data: order, loading, error, reload } = useAccountData<AccountOrder>(guest ? `/checkout/guest/orders/${id}` : `/orders/${id}`);
  async function claim() { setClaiming(true); setClaimError(''); try { await accountApi(`/checkout/guest/orders/${id}/claim`, { method: 'POST' }); router.replace(`/checkout/confirmation/${id}`); window.location.assign(`/checkout/confirmation/${id}`); } catch (reason) { setClaimError(reason instanceof Error ? reason.message : 'Unable to save this order.'); setClaiming(false); } }
  async function cancel() { setCancelling(true); setClaimError(''); try { await accountApi(`/checkout/guest/orders/${id}/cancel`, { method: 'PATCH' }); setCancelPrompt(false); reload(); } catch (reason) { setClaimError(reason instanceof Error ? reason.message : 'Unable to cancel this order.'); } finally { setCancelling(false); } }
  if (loading) return <p role="status">Loading your order…</p>;
  if (error || !order) return <div role="alert" className="commerce-notice">Your order details could not be loaded. <button onClick={reload}>Try again</button><p><Link href="/account/orders">View your orders</Link></p></div>;
  const address = order.shipping_address;
  return <div className="commerce-receipt"><header><p>{order.order_number}</p><h1>{order.status === 'cancelled' ? 'Order cancelled' : 'Your order is placed'}</h1><p>Placed on {dateLabel(order.created_at)}.</p>{guest && <p className="commerce-form-note">Save your order number. You can return to Guest orders on this browser for 30 days.</p>}</header><section className="commerce-panel"><h2>Order details</h2><dl><div><dt>Status</dt><dd>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</dd></div><div><dt>Total</dt><dd>{money(order.total_amount)}</dd></div><div><dt>Payment</dt><dd>{order.payment_method === 'cod' ? (order.fulfilment === 'pickup' ? 'Pay at collection' : 'Cash on delivery') : order.payment_method || 'Contact customer care'}{order.payment_status === 'pending' && order.status !== 'cancelled' && <span> · Payment due</span>}</dd></div><div><dt>{order.fulfilment === 'pickup' ? 'Collection' : 'Delivery address'}</dt><dd>{address ? [address.fullName, address.line1, address.line2, `${address.city}, ${address.state} ${address.postalCode}`, address.country].filter(Boolean).join(', ') : order.fulfilment === 'pickup' ? 'Our team will contact you to arrange collection.' : 'Contact customer care'}</dd></div></dl><div className="commerce-confirm-items">{order.items.map(item => <div key={item.id}><div><p>{item.title}</p><p className="commerce-muted">{[item.color, item.size && `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}</p></div><p>{money(item.price * item.quantity)}</p></div>)}</div>{order.shipments?.map((shipment, index) => <p key={index}>{shipment.carrier || 'Delivery'}: {shipment.status.replaceAll('_', ' ')}{shipment.tracking_number && ` · ${shipment.tracking_number}`}</p>)}</section>
    {guest && <section className="commerce-panel commerce-stack"><h2>{order.guest ? 'Keep this order in your account' : 'Saved to an account'}</h2>{order.guest ? <><p>Save this purchase with your order history.</p>{token ? <button className="commerce-button" disabled={claiming || cancelling} onClick={claim}>{claiming ? 'Saving…' : 'Add order to my account'}</button> : <Link className="commerce-button" href={`/login?next=${encodeURIComponent(`/checkout/confirmation/${id}?guest=1`)}`}>Sign in or create account</Link>}</> : <Link className="commerce-link" href="/account/orders">Open account orders</Link>}
      {order.guest && order.status === 'pending' && order.payment_method === 'cod' && order.payment_status !== 'paid' && (cancelPrompt ? <div role="group" aria-label="Confirm order cancellation"><p>Cancel {order.order_number}? This action cannot be undone.</p><div className="commerce-confirm-actions"><button className="commerce-button" disabled={cancelling || claiming} onClick={cancel}>{cancelling ? 'Cancelling…' : 'Yes, cancel order'}</button><button className="commerce-button secondary" disabled={cancelling} onClick={() => setCancelPrompt(false)}>Keep order</button></div></div> : <button className="commerce-link" disabled={claiming} onClick={() => setCancelPrompt(true)}>Cancel order</button>)}
      {claimError && <p role="alert">{claimError}</p>}</section>}
    <div className="commerce-confirm-actions"><Link href={guest ? '/track-order' : '/account/orders'} className="commerce-button">{guest ? 'Guest orders' : 'View my orders'}</Link><Link href="/shop" className="commerce-button secondary">Continue shopping</Link></div><a className="commerce-link" href={`mailto:care@shrutimangesh.com?subject=${encodeURIComponent(`Order ${order.order_number}`)}`}>Get help with this order</a></div>;
}
