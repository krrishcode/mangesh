import { useAuthStore } from '../stores/authStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = endpoint.startsWith('/admin/') || endpoint === '/admin' || endpoint.startsWith('/media/') ? useAdminAuthStore : useAuthStore;
  const token = session.getState().token;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api/account${endpoint}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401 && token === session.getState().token && !options.signal?.aborted && !endpoint.startsWith('/auth/')) session.getState().logout();
  if (!response.ok) throw new Error(result.error || 'Unable to complete this request. Please try again.');
  return result;
}
