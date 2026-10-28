'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { AuthFrame } from './AuthFrame';
import { accountApi } from '../user/useAccountData';
import { useAuthStore } from '../../stores/authStore';
import { authReturnPath } from '../../lib/auth-return';
export function RecoveryPage({ reset = false, embedded = false, initialEmail = '', onBack }: { reset?: boolean; embedded?: boolean; initialEmail?: string; onBack?: () => void }) {
  const [email, setEmail] = useState(initialEmail); const [token, setToken] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false); const [next, setNext] = useState('/account'); const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') || ''); setNext(authReturnPath()); setReady(true); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); if (reset && password !== confirm) { setError('Your passwords do not match.'); return; } setLoading(true);
    try { const result = await accountApi<{ message: string }>(reset ? '/auth/reset-password' : '/auth/forgot-password', { method: 'POST', body: JSON.stringify(reset ? { token, password } : { email: email.trim() }) }); if (reset) useAuthStore.getState().logout(); setMessage(result.message); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Please try again.'); } finally { setLoading(false); }
  }
  const content = <>
    {message ? <p className="auth-notice" role="status">{message}</p> : reset && ready && !token ? <p className="auth-error" role="alert">This reset link is missing or invalid. <Link href="/forgot-password">Request a new link</Link>.</p> : <form className="auth-form" onSubmit={submit}><fieldset disabled={loading || !ready}>
      {reset ? <><label>New password<div className="auth-password"><input type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={256} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button></div></label><label>Confirm new password<input type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={256} value={confirm} onChange={event => setConfirm(event.target.value)} /></label></> : <label>Email address<input type="email" autoComplete="email" required maxLength={255} value={email} onChange={event => setEmail(event.target.value)} /></label>}
      {error && <p role="alert" className="auth-error">{error}</p>}<button className="auth-submit">{loading ? 'Please wait…' : reset ? 'Update password' : 'Send reset link'}</button>
    </fieldset></form>}
    {embedded ? <button type="button" className="auth-back" onClick={onBack}>Back to sign in</button> : <Link className="auth-back" href={`/login?next=${encodeURIComponent(next)}`}>Back to sign in</Link>}
  </>;
  return embedded ? content : <AuthFrame title={message ? reset ? 'Password updated' : 'Check your inbox' : reset ? 'Choose a new password' : 'Forgot your password?'} description={reset ? 'Use a new password with at least 8 characters.' : 'Enter your email address to request a reset link.'}>{content}</AuthFrame>;
}
