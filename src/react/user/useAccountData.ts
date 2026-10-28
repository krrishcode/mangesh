'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

const accountDataCache = new Map<string, unknown>();
const invalidationListeners = new Set<(paths: string[]) => void>();

export function subscribeAccountData(listener: (paths: string[]) => void) {
  invalidationListeners.add(listener);
  return () => { invalidationListeners.delete(listener); };
}

export function clearAccountDataCache() {
  accountDataCache.clear();
}

export function invalidateAccountData(paths: string[]) {
  for (const key of accountDataCache.keys()) {
    if (paths.some(path => key.slice(key.indexOf(':') + 1).startsWith(path))) accountDataCache.delete(key);
  }
  for (const listener of invalidationListeners) listener(paths);
}

useAuthStore.subscribe((state, previous) => {
  if (state.token !== previous.token) clearAccountDataCache();
});

export async function accountApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api/account${path}`, {
    ...options,
    headers,
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401 && token && token === useAuthStore.getState().token && !path.startsWith('/checkout/guest') && !path.startsWith('/auth/google')) {
    clearAccountDataCache();
    useAuthStore.getState().logout();
  }
  if (!response.ok || result.success === false) {
    const detail = result.details && typeof result.details === 'object'
      ? Object.entries(result.details).find(([, value]) => Array.isArray(value) && typeof value[0] === 'string')
      : undefined;
    const field = detail?.[0].replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase());
    const message = detail ? `${field}: ${(detail[1] as string[])[0]}` : result.error;
    throw new Error(message || 'Unable to complete this request. Please try again.');
  }
  if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
    if (path === '/checkout' || path === '/checkout/guest' || path.startsWith('/orders/') || path.startsWith('/checkout/guest/orders/')) {
      invalidateAccountData(['/orders', '/checkout/guest/orders']);
    } else if (path.startsWith('/users/me/addresses')) {
      invalidateAccountData(['/users/me/addresses']);
    } else if (path.startsWith('/appointments')) {
      invalidateAccountData(['/appointments']);
    } else if (path.startsWith('/wishlist')) {
      invalidateAccountData(['/wishlist']);
    } else if (path === '/users/me/measurements') {
      invalidateAccountData(['/users/me/measurements']);
    }
  }
  return result;
}

export function useAccountData<T>(path: string, enabled = true) {
  const token = useAuthStore(state => state.token);
  const cacheKey = `${token ?? 'guest'}:${path}`;
  const [state, setState] = useState<{ key: string; data: T | null; loading: boolean; error: string; refreshError: string }>(() => ({ key: cacheKey, data: (accountDataCache.get(cacheKey) as T | undefined) ?? null, loading: !accountDataCache.has(cacheKey), error: '', refreshError: '' }));
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const invalidate = (paths: string[]) => { if (paths.some(prefix => path.startsWith(prefix))) reload(); };
    const refresh = () => { if (document.visibilityState === 'visible') reload(); };
    const unsubscribe = subscribeAccountData(invalidate);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { unsubscribe(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [path, reload]);
  useEffect(() => {
    if (!enabled) { setState({ key: cacheKey, data: null, loading: false, error: '', refreshError: '' }); return; }
    const controller = new AbortController();
    const cached = accountDataCache.get(cacheKey) as T | undefined;
    const hasCachedData = accountDataCache.has(cacheKey);
    setState(previous => {
      const hasData = hasCachedData || (previous.key === cacheKey && previous.data !== null);
      return { key: cacheKey, data: cached !== undefined ? cached : previous.key === cacheKey ? previous.data : null, loading: !hasData, error: '', refreshError: '' };
    });
    accountApi<{ data: T }>(path, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { accountDataCache.set(cacheKey, result.data); setState({ key: cacheKey, data: result.data, loading: false, error: '', refreshError: '' }); } })
      .catch(reason => {
        if (controller.signal.aborted) return;
        const message = reason instanceof Error ? reason.message : 'Unable to load your account.';
        setState(previous => {
          const hasData = hasCachedData || previous.data !== null;
          return { ...previous, loading: false, error: hasData ? '' : message, refreshError: hasData ? message : '' };
        });
      });
    return () => controller.abort();
  }, [path, version, enabled, cacheKey]);
  const current = state.key === cacheKey ? state : { data: (accountDataCache.get(cacheKey) as T | undefined) ?? null, loading: !accountDataCache.has(cacheKey), error: '', refreshError: '' };
  return { ...current, reload };
}
