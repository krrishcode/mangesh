'use client';

import Link from 'next/link';
import { effectivePrice, formatPrice } from '../../../../lib/product';
import { useState } from 'react';
import { accountApi, useAccountData } from '../../useAccountData';
import { money, type WishlistItem } from '../../account';
import { AccountEmpty, AccountError, AccountFeedback, AccountLoading } from '../ui/AccountElements';

export function WishlistView() {
  const { data, loading, error, refreshError, reload } = useAccountData<WishlistItem[]>('/wishlist');
  const [removing, setRemoving] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  async function remove(id: number) {
    setRemoving(id); setFeedback('');
    try { await accountApi(`/wishlist/${id}`, { method: 'DELETE' }); reload(); }
    catch { setFeedback('We couldn’t remove this item. Please try again.'); }
    finally { setRemoving(null); }
  }
  if (loading) return <AccountLoading />;
  if (error) return <AccountError retry={reload} />;
  return <div>
    <AccountFeedback message={feedback} error />
    {refreshError && <AccountFeedback message="Your wishlist could not be refreshed. Showing your last saved selection." error />}
    {!data?.length ? <AccountEmpty title="Keep the pieces you love close" icon="heart"><p>Save something that catches your eye. You’ll find your favourites here whenever you return.</p><Link href="/shop" className="account-button">Explore the collection</Link></AccountEmpty> : <>
      <div className="account-toolbar"><p className="account-muted">{data.length} saved {data.length === 1 ? 'piece' : 'pieces'}</p><Link href="/shop" className="account-link">Continue shopping</Link></div>
      <div className="account-wishlist-grid">{data.map((item) => <article key={item.id} className="account-wishlist-item">
        <Link className="account-wishlist-image" href={item.available === false ? '/shop' : `/products/${item.product_id}`} aria-label={item.available === false ? `${item.title} is unavailable. Explore other pieces.` : item.title}>{item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" /> : <span>Image unavailable</span>}</Link>
        <button className="account-wishlist-remove" type="button" disabled={removing !== null} onClick={() => remove(item.product_id)} aria-label={`Remove ${item.title} from wishlist`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
        <h2>{item.available === false ? item.title : <Link href={`/products/${item.product_id}`}>{item.title}</Link>}</h2><p>{item.price == null ? 'Price unavailable' : formatPrice(effectivePrice({ price: Number(item.price), salePrice: item.sale_price }))}</p>
        {!item.in_stock && <p className="account-muted">Currently unavailable</p>}
        <Link href={item.available === false ? '/shop' : `/products/${item.product_id}`} className="account-button secondary">{item.available === false ? 'Explore other pieces' : 'View product'}</Link>
      </article>)}</div>
    </>}
  </div>;
}
