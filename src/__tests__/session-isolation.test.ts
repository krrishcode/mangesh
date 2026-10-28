import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserDto } from '../types';

const customer = { id: 14, name: 'Customer', email: 'customer@example.invalid', role: 'customer', phone: null } satisfies UserDto;
const admin = { id: 20, name: 'Admin', email: 'admin@example.invalid', role: 'admin', phone: null } satisfies UserDto;
let storage: Map<string, string>;

beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal('window', { localStorage });
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));
});
afterEach(() => vi.unstubAllGlobals());

describe('independent customer and admin sessions', () => {
  it('keeps the customer signed in when the console signs in or out', async () => {
    const { useAuthStore } = await import('../stores/authStore');
    const { useAdminAuthStore } = await import('../stores/adminAuthStore');
    useAuthStore.getState().setAuth(customer, 'customer-token');
    useAdminAuthStore.getState().setAuth(admin, 'admin-token');
    expect(useAuthStore.getState().user?.id).toBe(14);
    useAdminAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBe('customer-token');
  });

  it('does not overwrite a customer session when an admin result reaches the shared sign-in setter', async () => {
    const { useAuthStore } = await import('../stores/authStore');
    const { useAdminAuthStore } = await import('../stores/adminAuthStore');
    useAuthStore.getState().setAuth(customer, 'customer-token');
    useAuthStore.getState().setAuth(admin, 'admin-token');
    expect(useAuthStore.getState().token).toBe('customer-token');
    expect(useAdminAuthStore.getState().token).toBe('admin-token');
  });

  it('migrates the old shared admin session once without leaving it in customer storage', async () => {
    storage.set('ecommerce-auth-storage', JSON.stringify({ state: { user: admin, token: 'legacy-admin-token', isAuthenticated: true }, version: 0 }));
    const { useAuthStore } = await import('../stores/authStore');
    const { useAdminAuthStore } = await import('../stores/adminAuthStore');
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAdminAuthStore.getState().token).toBe('legacy-admin-token');
    expect(JSON.parse(storage.get('ecommerce-auth-storage')!).state.token).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends the correct token for each API and keeps the customer signed in after an admin 401', async () => {
    const { useAuthStore } = await import('../stores/authStore');
    const { useAdminAuthStore } = await import('../stores/adminAuthStore');
    const { fetchApi } = await import('../lib/api');
    useAuthStore.getState().setAuth(customer, 'customer-token');
    useAdminAuthStore.getState().setAuth(admin, 'admin-token');
    await fetchApi('/orders');
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer customer-token');
    await fetchApi('/admin/orders');
    expect(new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer admin-token');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 }));
    await expect(fetchApi('/admin/orders')).rejects.toThrow('Session expired');
    expect(useAdminAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().token).toBe('customer-token');
  });

  it('refreshes mounted order lists after checkout and claiming a guest receipt', async () => {
    const { accountApi, subscribeAccountData } = await import('../react/user/useAccountData');
    const changed = vi.fn();
    const unsubscribe = subscribeAccountData(changed);
    await accountApi('/checkout', { method: 'POST' });
    await accountApi('/checkout/guest/orders/6/claim', { method: 'POST' });
    expect(changed).toHaveBeenCalledTimes(2);
    expect(changed).toHaveBeenLastCalledWith(['/orders', '/checkout/guest/orders']);
    unsubscribe();
    await accountApi('/orders/6/cancel', { method: 'PATCH' });
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('does not invalidate orders after a failed checkout request', async () => {
    const { accountApi, subscribeAccountData } = await import('../react/user/useAccountData');
    const changed = vi.fn();
    const unsubscribe = subscribeAccountData(changed);
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Out of stock' }), { status: 409 }));
    await expect(accountApi('/checkout', { method: 'POST' })).rejects.toThrow('Out of stock');
    expect(changed).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('does not sign out a new customer when an old session request returns 401', async () => {
    const { useAuthStore } = await import('../stores/authStore');
    const { accountApi } = await import('../react/user/useAccountData');
    useAuthStore.getState().setAuth(customer, 'old-customer-token');
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const pending = accountApi('/orders');
    useAuthStore.getState().setAuth(customer, 'new-customer-token');
    finish(new Response(JSON.stringify({ error: 'Expired old session' }), { status: 401 }));
    await expect(pending).rejects.toThrow('Expired old session');
    expect(useAuthStore.getState().token).toBe('new-customer-token');
  });

  it('shows the field-specific backend error for an invalid account form', async () => {
    const { accountApi } = await import('../react/user/useAccountData');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Validation failed', details: { phone: ['Enter a valid phone number.'] } }), { status: 400 }));
    await expect(accountApi('/users/me', { method: 'PUT' })).rejects.toThrow('Phone: Enter a valid phone number.');
  });

  it('refreshes saved measurements after a successful update', async () => {
    const { accountApi, subscribeAccountData } = await import('../react/user/useAccountData');
    const changed = vi.fn();
    const unsubscribe = subscribeAccountData(changed);
    await accountApi('/users/me/measurements', { method: 'PUT' });
    expect(changed).toHaveBeenCalledWith(['/users/me/measurements']);
    unsubscribe();
  });

  it('does not revoke the new admin session when a retired read returns an old 401', async () => {
    const { useAdminAuthStore } = await import('../stores/adminAuthStore');
    const { fetchApi } = await import('../lib/api');
    useAdminAuthStore.getState().setAuth(admin, 'old-admin-token');
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const pending = fetchApi('/admin/settings');
    useAdminAuthStore.getState().setAuth(admin, 'new-admin-token');
    finish(new Response(JSON.stringify({ error: 'Expired old session' }), { status: 401 }));
    await expect(pending).rejects.toThrow('Expired old session');
    expect(useAdminAuthStore.getState().token).toBe('new-admin-token');
  });
});
