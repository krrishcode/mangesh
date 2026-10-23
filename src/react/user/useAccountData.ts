'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export async function accountApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`/api/account${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401 && token && !path.startsWith('/checkout/guest') && !path.startsWith('/auth/google')) useAuthStore.getState().logout();
  if (!response.ok || result.success === false) throw new Error(result.error || 'Unable to complete this request. Please try again.');
  return result;
}

export function useAccountData<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) { setData(null); setLoading(false); setError(''); return; }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    accountApi<{ data: T }>(path, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result.data); })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load your account.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, version, enabled]);
  return { data, loading, error, reload };
}
