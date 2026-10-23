import { useAuthStore } from '../stores/authStore';
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api/account${endpoint}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401 && !endpoint.startsWith('/auth/')) useAuthStore.getState().logout();
  if (!response.ok) throw new Error(result.error || 'Unable to complete this request. Please try again.');
  return result;
}
