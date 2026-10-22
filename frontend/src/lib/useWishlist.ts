'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { accountApi } from '../react/user/useAccountData';
export function useWishlist() {
  const token = useAuthStore(state => state.token);
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setIds([]); setError('');
    setLoading(Boolean(token));
    if (token) accountApi<{ data: Array<{ product_id: number }> }>('/wishlist', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setIds(result.data.map(item => String(item.product_id))); })
      .catch(() => { if (!controller.signal.aborted) setError('Saved items could not be loaded. Please refresh before changing your wishlist.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, version]);
  async function toggle(id: string) {
    if (!token) { router.push('/login?next=' + encodeURIComponent(window.location.pathname)); return; }
    if (busy || error || loading) return;
    setBusy(id);
    try {
      const saved = ids.includes(id);
      await accountApi(saved ? `/wishlist/${id}` : '/wishlist', { method: saved ? 'DELETE' : 'POST', ...(saved ? {} : { body: JSON.stringify({ productId: Number(id) }) }) });
      setIds(current => saved ? current.filter(value => value !== id) : [...current, id]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save this item.'); }
    finally { setBusy(null); }
  }
  return { ids, busy, error, loading, toggle, reload: () => setVersion(value => value + 1) };
}
