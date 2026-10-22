'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { authReturnPath } from '../../lib/auth-return';
import { accountApi } from '../user/useAccountData';
import type { UserDto } from '../../types';
type GoogleIdentity = { accounts: { id: { initialize: (options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void }) => void; renderButton: (element: HTMLElement, options: Record<string, unknown>) => void } } };
declare global { interface Window { google?: GoogleIdentity } }
let loader: Promise<void> | undefined;
function loadGoogle() {
  if (window.google) return Promise.resolve();
  if (!loader) loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onload = () => resolve(); script.onerror = () => { loader = undefined; script.remove(); reject(new Error('Google sign-in could not be loaded. Please use email and password.')); };
    document.head.appendChild(script);
  });
  return loader;
}
export function GoogleSignIn() {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState(''); const [error, setError] = useState(''); const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      // React development remounts must not start competing nonce requests.
      await Promise.resolve();
      if (!active) return;
      const { data } = await accountApi<{ data: { enabled: boolean; clientId?: string; nonce?: string } }>('/auth/google/config', { signal: controller.signal });
      if (!active) return; setEnabled(data.enabled); if (!data.enabled) return;
      await loadGoogle(); if (!active || !container.current || !window.google) return;
      window.google.accounts.id.initialize({ client_id: data.clientId!, nonce: data.nonce!, callback: async ({ credential }) => {
        setError(''); setStatus('Signing in…');
        try { const result = await accountApi<{ data: { user: UserDto; token: string } }>('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }); useAuthStore.getState().setAuth(result.data.user, result.data.token); router.replace(authReturnPath()); }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in.'); } finally { setStatus(''); }
      } });
      window.google.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', width: Math.min(container.current.clientWidth || 340, 400), text: 'continue_with', shape: 'rectangular' });
    })().catch(reason => { if (active) setError(reason.message || 'Google sign-in is unavailable.'); });
    return () => { active = false; controller.abort(); };
  }, [router]);
  return <div className="auth-google"><div ref={container} />{enabled === null && !error && <p role="status">Loading sign-in options…</p>}{enabled === false && <><button type="button" className="auth-google-unavailable" disabled>Continue with Google</button><p className="auth-help">Google sign-in is currently unavailable.</p></>}{status && <p role="status">{status}</p>}{error && <p className="auth-error" role="alert">{error} <button type="button" onClick={() => window.location.reload()}>Refresh sign-in</button></p>}</div>;
}
