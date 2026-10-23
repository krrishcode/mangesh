'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { accountApi, useAccountData } from '../react/user/useAccountData';
import type { Address } from '../react/user/account';
import { formatPrice } from '../lib/product';
import type { MensProduct } from '../data/mensCollection';
import '../styles/commerce.css';

type Quote = { subtotal: number; shipping: number; total: number; lines: Array<{ product_id: number; title: string; color: string; size: string; unitPrice: number; quantity: number; image_url?: string | null }> };
export function CheckoutPage() {
  const token = useAuthStore(state => state.token);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return <main id="main" className="commerce-shell">{!hydrated ? <p role="status">Loading checkout…</p> : <CheckoutForm key={token ? 'member' : 'guest'} guest={!token} />}</main>;
}
function CheckoutForm({ guest }: { guest: boolean }) {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { items, clearCart } = useCartStore();
  const addresses = useAccountData<Address[]>('/users/me/addresses', !guest);
  const [contact, setContact] = useState({ email: '', name: '', phone: '' });
  const [sessionReady, setSessionReady] = useState(!guest);
  const [sessionError, setSessionError] = useState('');
  const [addressId, setAddressId] = useState<number | null>(null);
  const [fulfilment, setFulfilment] = useState<'home' | 'pickup'>('home');
  const [available, setAvailable] = useState<Array<'home' | 'pickup'>>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [adding, setAdding] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressForm, setAddressForm] = useState({ fullName: user?.name || '', phone: user?.phone || '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' });
  const attempt = useRef<{ signature: string; requestId: string } | null>(null);
  const serializedItems = JSON.stringify(items.map(item => ({ product_id: Number(item.product_id), color: item.color, size: item.size, quantity: item.quantity })));
  useEffect(() => {
    if (!guest) return;
    const controller = new AbortController();
    setSessionError('');
    accountApi('/checkout/session', { method: 'POST', signal: controller.signal })
      .then(() => { if (!controller.signal.aborted) setSessionReady(true); })
      .catch(reason => { if (!controller.signal.aborted) setSessionError(reason.message || 'Unable to start checkout.'); });
    return () => controller.abort();
  }, [guest, version]);
  useEffect(() => {
    const saved = addresses.data?.filter(address => address.label === 'shipping') || [];
    if (addressId === null) setAddressId(saved.find(address => address.isDefault)?.id || saved[0]?.id || null);
  }, [addresses.data, addressId]);
  useEffect(() => {
    const controller = new AbortController();
    setQuote(null); setError(''); setLoading(true);
    if (!items.length) { setLoading(false); return; }
    (async () => {
      const response = await fetch('/api/catalog', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('We couldn’t check your bag. Please try again.');
      const { products } = await response.json() as { products: MensProduct[] };
      const selected = JSON.parse(serializedItems) as Array<{ product_id: number }>;
      const methods = (['home', 'pickup'] as const).filter(method => selected.every(item => {
        const product = products.find(product => product.id === String(item.product_id));
        return product && (product.deliveryMethod === 'both' || product.deliveryMethod === method);
      }));
      setAvailable(methods);
      if (!methods.length) throw new Error('These items do not share a delivery method. Please place separate orders.');
      if (!methods.includes(fulfilment)) { setFulfilment(methods[0]); return; }
      const result = await accountApi<{ data: Quote }>('/checkout/quote', { method: 'POST', signal: controller.signal, body: JSON.stringify({ items: JSON.parse(serializedItems), fulfilment }) });
      if (!controller.signal.aborted) setQuote(result.data);
    })().catch(reason => { if (!controller.signal.aborted) setError(reason.message || 'Unable to load checkout.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [serializedItems, fulfilment, version]);
  async function addAddress(event: FormEvent) {
    event.preventDefault(); setSavingAddress(true); setAddressError('');
    try {
      const result = await accountApi<{ data: Address }>('/users/me/addresses', { method: 'POST', body: JSON.stringify({ ...addressForm, label: 'shipping', isDefault: !addresses.data?.some(address => address.label === 'shipping') }) });
      setAddressId(result.data.id); setAdding(false); addresses.reload();
    } catch (reason) { setAddressError(reason instanceof Error ? reason.message : 'Unable to save this address.'); }
    finally { setSavingAddress(false); }
  }
  async function placeOrder() {
    if (!quote || placing || !sessionReady || (!guest && fulfilment === 'home' && !addressId)) return;
    setPlacing(true); setError('');
    const payload = { items: JSON.parse(serializedItems), fulfilment, ...(guest ? { contact, ...(fulfilment === 'home' ? { shippingAddress: { ...addressForm, fullName: contact.name, phone: contact.phone, label: 'shipping' } } : {}) } : fulfilment === 'home' ? { addressId } : {}), paymentMethod: 'cod', expectedTotal: quote.total };
    const signature = JSON.stringify(payload);
    try {
      if (!attempt.current) { try { attempt.current = JSON.parse(sessionStorage.getItem('checkout-attempt') || 'null'); } catch { /* Storage may be unavailable. */ } }
      if (attempt.current?.signature !== signature) attempt.current = { signature, requestId: crypto.randomUUID() };
      try { sessionStorage.setItem('checkout-attempt', JSON.stringify(attempt.current)); } catch { /* The current render still retains the request ID. */ }
      const result = await accountApi<{ data: { id: number } }>(guest ? '/checkout/guest' : '/checkout', { method: 'POST', body: JSON.stringify({ ...payload, requestId: attempt.current.requestId }) });
      clearCart();
      try { sessionStorage.removeItem('checkout-attempt'); } catch { /* No persisted attempt. */ }
      router.replace(`/checkout/confirmation/${result.data.id}${guest ? '?guest=1' : ''}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Your order could not be placed. Please try again.'); }
    finally { setPlacing(false); }
  }
  if (!items.length) return <div className="commerce-panel commerce-empty"><h1>Your bag is empty</h1><Link href="/shop" className="commerce-button">Browse clothing</Link></div>;
  return <><nav className="commerce-breadcrumb" aria-label="Breadcrumb"><Link href="/cart">Shopping bag</Link><span>/</span><span>Checkout</span></nav><h1>Checkout</h1>
    {error && <div role="alert" className="commerce-notice">{error} <button onClick={() => setVersion(value => value + 1)}>Refresh summary</button></div>}
    <div className="commerce-layout"><div className="commerce-stack">
      <section className="commerce-panel commerce-form"><h2>Delivery method</h2>{available.map(method => <label key={method} className="commerce-choice"><input type="radio" name="fulfilment" value={method} checked={fulfilment === method} disabled={placing} onChange={() => setFulfilment(method)} /><span>{method === 'home' ? 'Home delivery' : 'Store pickup'}</span></label>)}{loading && <p role="status">Checking your order…</p>}{fulfilment === 'pickup' && <p className="commerce-form-note">Our team will contact you to arrange collection.</p>}</section>
      {guest && <form id="guest-checkout-details" className="commerce-panel commerce-form" onSubmit={event => { event.preventDefault(); void placeOrder(); }}>
        <div className="commerce-section-title"><h2>Contact & delivery</h2><Link className="commerce-link" href="/login?next=/checkout">Sign in</Link></div>
        <p className="commerce-form-note">Continue as a guest. No account needed.</p>
        {sessionError && <p role="alert" className="commerce-error">{sessionError} <button type="button" onClick={() => setVersion(value => value + 1)}>Try again</button></p>}
        <fieldset disabled={placing} className="commerce-form-grid commerce-fieldset">
          <label>Email address<input type="email" autoComplete="email" required maxLength={255} value={contact.email} onChange={event => setContact({ ...contact, email: event.target.value })} /></label>
          <label>Full name<input autoComplete="name" required minLength={2} maxLength={255} value={contact.name} onChange={event => setContact({ ...contact, name: event.target.value })} /></label>
          <label>Phone number<input type="tel" autoComplete="tel" required minLength={6} maxLength={32} value={contact.phone} onChange={event => setContact({ ...contact, phone: event.target.value })} /></label>
          {fulfilment === 'home' && ([{ key: 'line1', label: 'Address line 1', auto: 'address-line1', min: 4 }, { key: 'line2', label: 'Address line 2 (optional)', auto: 'address-line2', min: 0 }, { key: 'city', label: 'City', auto: 'address-level2', min: 2 }, { key: 'state', label: 'State / region', auto: 'address-level1', min: 2 }, { key: 'postalCode', label: 'Postal code', auto: 'postal-code', min: 4 }, { key: 'country', label: 'Country', auto: 'country-name', min: 2 }] as const).map(field => <label key={field.key}>{field.label}<input autoComplete={field.auto} required={field.key !== 'line2'} minLength={field.min} maxLength={field.key === 'postalCode' ? 16 : field.key === 'city' || field.key === 'state' || field.key === 'country' ? 128 : 255} value={addressForm[field.key]} onChange={event => setAddressForm({ ...addressForm, [field.key]: event.target.value })} /></label>)}
        </fieldset><p className="commerce-form-note">Your contact details are used to fulfil this order.</p>
      </form>}
      {!guest && fulfilment === 'home' && <section className="commerce-panel commerce-form"><div className="commerce-section-title"><h2>Delivery address</h2><button className="commerce-link" disabled={placing} onClick={() => setAdding(value => !value)}>{adding ? 'Close form' : 'Add address'}</button></div>
        {addresses.loading ? <p role="status">Loading addresses…</p> : addresses.error ? <div role="alert">Unable to load your addresses. <button className="commerce-link" onClick={addresses.reload}>Try again</button></div> : <>{addresses.data?.filter(address => address.label === 'shipping').map(address => <label className="commerce-choice" key={address.id}><input type="radio" name="address" checked={addressId === address.id} disabled={placing} onChange={() => setAddressId(address.id)} /><span><strong>{address.fullName}</strong><span>{[address.line1, address.line2, `${address.city}, ${address.state} ${address.postalCode}`, address.country].filter(Boolean).join(', ')}</span><span>{address.phone}</span></span></label>)}{!addresses.data?.some(address => address.label === 'shipping') && <p>Add a delivery address to place your order.</p>}</>}
        {adding && <form className="commerce-form" onSubmit={addAddress}><div className="commerce-form-grid">{([{ key: 'fullName', label: 'Full name', auto: 'name', min: 2 }, { key: 'phone', label: 'Phone', auto: 'tel', min: 6 }, { key: 'line1', label: 'Address line 1', auto: 'address-line1', min: 4 }, { key: 'line2', label: 'Address line 2 (optional)', auto: 'address-line2', min: 0 }, { key: 'city', label: 'City', auto: 'address-level2', min: 2 }, { key: 'state', label: 'State / region', auto: 'address-level1', min: 2 }, { key: 'postalCode', label: 'Postal code', auto: 'postal-code', min: 4 }, { key: 'country', label: 'Country', auto: 'country-name', min: 2 }] as const).map(field => <label key={field.key}>{field.label}<input autoComplete={field.auto} type={field.key === 'phone' ? 'tel' : 'text'} required={field.key !== 'line2'} minLength={field.min} maxLength={field.key === 'phone' ? 32 : field.key === 'postalCode' ? 16 : 255} value={addressForm[field.key]} onChange={event => setAddressForm({ ...addressForm, [field.key]: event.target.value })} /></label>)}</div>{addressError && <p role="alert" className="commerce-error">{addressError}</p>}<button className="commerce-button secondary" disabled={savingAddress}>{savingAddress ? 'Saving…' : 'Save address'}</button></form>}
      </section>}
      <section className="commerce-panel commerce-form"><h2>Payment</h2><label className="commerce-choice"><input type="radio" name="payment" checked readOnly /><span><strong>{fulfilment === 'pickup' ? 'Pay at collection' : 'Cash on delivery'}</strong><span className="commerce-muted">{fulfilment === 'pickup' ? 'Pay when you collect your order.' : 'Pay when you receive your order.'}</span></span></label></section>
    </div><aside className="commerce-panel commerce-summary"><h2>Order summary</h2>{quote ? <><div className="commerce-stack">{quote.lines.map(line => <div className="commerce-summary-item" key={JSON.stringify([line.product_id, line.color, line.size])}>{line.image_url && <img src={line.image_url} alt="" />}<div><p>{line.title}</p><p className="commerce-muted">{line.color} · Size {line.size} · Qty {line.quantity}</p><p>{formatPrice(line.unitPrice * line.quantity / 100)}</p></div></div>)}</div><dl><div><dt>Subtotal</dt><dd>{formatPrice(quote.subtotal / 100)}</dd></div><div><dt>Delivery</dt><dd>{quote.shipping ? formatPrice(quote.shipping / 100) : 'Included'}</dd></div><div className="commerce-total"><dt>Total</dt><dd>{formatPrice(quote.total / 100)}</dd></div></dl></> : <p role="status">{loading ? 'Loading order summary…' : 'Review your bag to continue.'}</p>}
      <button className="commerce-button" type={guest ? 'submit' : 'button'} form={guest ? 'guest-checkout-details' : undefined} disabled={placing || loading || !quote || !sessionReady || (!guest && fulfilment === 'home' && (!addressId || addresses.loading || Boolean(addresses.error)))} onClick={guest ? undefined : placeOrder}>{placing ? 'Placing order…' : 'Place order'}</button><p className="commerce-form-note">Payment is due {fulfilment === 'pickup' ? 'at collection' : 'on delivery'}.</p><Link href="/cart" className="commerce-link">Edit shopping bag</Link>
    </aside></div>
  </>;
}
