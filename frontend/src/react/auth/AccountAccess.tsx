'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { accountApi } from '../user/useAccountData';
import { authReturnPath } from '../../lib/auth-return';
import type { UserDto } from '../../types';
import { AuthFrame } from './AuthFrame';
import { GoogleSignIn } from './GoogleSignIn';
export function AccountAccess({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register'; const router = useRouter(); const { token, setAuth } = useAuthStore();
  const [next, setNext] = useState('/account'); const [hydrated, setHydrated] = useState(false); const [updated, setUpdated] = useState(false);
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirm: '' }); const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  useEffect(() => { setNext(authReturnPath()); setUpdated(new URLSearchParams(window.location.search).get('passwordUpdated') === '1'); setHydrated(true); }, []);
  useEffect(() => { if (hydrated && token) router.replace(next); }, [hydrated, token, next, router]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); if (registering && fields.password !== fields.confirm) { setError('Your passwords do not match.'); return; } setLoading(true);
    try { const { data } = await accountApi<{ data: { user: UserDto; token: string } }>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email: fields.email.trim(), password: fields.password, ...(registering ? { name: fields.name.trim() } : {}) }) }); setAuth(data.user, data.token); router.replace(next); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue. Please try again.'); } finally { setLoading(false); }
  }
  return <AuthFrame mode={mode} next={next} title={registering ? 'Create your account' : 'Welcome back'} description={registering ? 'Save your favourites, delivery addresses and order history.' : 'Sign in to view your orders and saved pieces.'}>
    {updated && <p role="status" className="auth-notice">Password updated. Sign in with your new password.</p>}<GoogleSignIn /><div className="auth-divider"><span>or continue with email</span></div>
    <form className="auth-form" onSubmit={submit}><fieldset disabled={loading}>
      {registering && <label htmlFor="access-name">Full name<input id="access-name" autoComplete="name" required minLength={2} maxLength={255} value={fields.name} onChange={event => setFields({ ...fields, name: event.target.value })} /></label>}
      <label htmlFor="access-email">Email address<input id="access-email" type="email" autoComplete="email" required maxLength={255} value={fields.email} onChange={event => setFields({ ...fields, email: event.target.value })} /></label>
      <label htmlFor="access-password">Password<div className="auth-password"><input id="access-password" aria-label="Password" type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 8 : 1} maxLength={256} value={fields.password} onChange={event => setFields({ ...fields, password: event.target.value })} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
      {registering ? <><p className="auth-help">Use at least 8 characters.</p><label htmlFor="access-confirm">Confirm password<input id="access-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={256} value={fields.confirm} onChange={event => setFields({ ...fields, confirm: event.target.value })} /></label></> : <Link className="auth-forgot" href={`/forgot-password?next=${encodeURIComponent(next)}`}>Forgot password?</Link>}
      {error && <p role="alert" className="auth-error">{error}</p>}<button className="auth-submit" type="submit">{loading ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
    </fieldset></form>
    {next.startsWith('/checkout') && <Link href="/checkout" className="auth-guest-link">Continue as a guest</Link>}
    <p className="auth-bottom">{registering ? 'Already registered?' : 'New to Mangesh Mahadev?'} <Link href={`/${registering ? 'login' : 'register'}?next=${encodeURIComponent(next)}`}>{registering ? 'Sign in' : 'Create an account'}</Link></p><div className="auth-service-links"><Link href="/track-order">Guest orders</Link><a href="mailto:care@shrutimangesh.com">Need help?</a></div>
  </AuthFrame>;
}
