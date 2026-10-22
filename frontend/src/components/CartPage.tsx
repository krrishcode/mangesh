'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cartLineId, useCartStore } from '../stores/cartStore';
import { formatPrice } from '../lib/product';
import '../styles/commerce.css';
export function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart, syncProducts, needsReview } = useCartStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setReady(false); setError('');
    fetch('/api/catalog', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('We couldn’t check availability. Please try again.');
      const data = await response.json(); syncProducts(data.products);
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); }).finally(() => { if (!controller.signal.aborted) setReady(true); });
    return () => controller.abort();
  }, [syncProducts, version]);
  const quantities = (id: string | number) => items.filter(item => String(item.product_id) === String(id)).reduce((sum, item) => sum + item.quantity, 0);
  const invalid = items.some(item => item.max_quantity <= 0 || quantities(item.product_id) > item.max_quantity);
  return <main id="main" className="commerce-shell"><nav className="commerce-breadcrumb" aria-label="Breadcrumb"><Link href="/shop">Shop</Link><span>/</span><span>Shopping bag</span></nav><h1>Shopping bag</h1>
    {!ready ? <p role="status">Loading your bag…</p> : <>
      {needsReview && <p className="commerce-notice">Please reselect any items added before the bag update so their size and colour are saved correctly.</p>}
      {error && <div role="alert" className="commerce-notice">{error} <button onClick={() => setVersion(value => value + 1)}>Try again</button></div>}
      {!items.length ? <div className="commerce-panel commerce-empty"><h2>Your bag is empty</h2><p>Browse clothing to find your next piece.</p><Link className="commerce-button" href="/shop">Browse clothing</Link></div> : <div className="commerce-layout"><section aria-label="Bag items" className="commerce-stack">
        {items.map(item => <article key={cartLineId(item)} className="commerce-panel commerce-bag-item">
          <Link href={`/products/${item.product_id}`} className="commerce-bag-image">{item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>Image unavailable</span>}</Link>
          <div className="commerce-bag-details"><Link href={`/products/${item.product_id}`}><h2>{item.title}</h2></Link><p className="commerce-muted">{[item.color, item.size ? `Size ${item.size}` : 'Choose size'].filter(Boolean).join(' · ')}</p>
            <p>{formatPrice(item.price)}</p>{item.max_quantity <= 0 ? <p role="alert">This selection is currently unavailable. Please remove it or choose another size.</p> : quantities(item.product_id) > item.max_quantity && <p role="alert">Only {item.max_quantity} available. Reduce your quantity to continue.</p>}
            <div className="commerce-line-actions"><div className="commerce-quantity"><button aria-label={`Decrease quantity of ${item.title}, size ${item.size}`} disabled={item.quantity <= 1} onClick={() => updateQuantity(cartLineId(item), item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={`Increase quantity of ${item.title}, size ${item.size}`} disabled={quantities(item.product_id) >= item.max_quantity || item.quantity >= 99} onClick={() => updateQuantity(cartLineId(item), item.quantity + 1)}>+</button></div><button className="commerce-link" onClick={() => removeItem(cartLineId(item))}>Remove</button><strong>{formatPrice(item.price * item.quantity)}</strong></div>
          </div>
        </article>)}<button className="commerce-link" onClick={clearCart}>Clear bag</button>
      </section><aside className="commerce-panel commerce-summary"><h2>Order summary</h2><dl><div><dt>Subtotal</dt><dd>{formatPrice(totalPrice())}</dd></div><div><dt>Delivery</dt><dd>Calculated at checkout</dd></div></dl><p className="commerce-muted">Cash on delivery available.</p>{invalid || error ? <button className="commerce-button" disabled>Review your bag</button> : <Link href="/checkout" className="commerce-button">Proceed to checkout</Link>}<Link href="/shop" className="commerce-link">Continue shopping</Link></aside></div>}
    </>}
  </main>;
}
