'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { UserDto } from '../../types';
import { accountApi } from '../user/useAccountData';

type Challenge = { challengeId: string; email: string; isNewCustomer: boolean; delivery: 'email' | 'development'; resendAfter: number };

export function EmailOtpAccess({ initialEmail = '', titleId, descriptionId, onSuccess }: {
  initialEmail?: string; titleId?: string; descriptionId?: string; onSuccess: (user: UserDto) => void;
}) {
  const id = useId();
  const [email, setEmail] = useState(initialEmail);
  const [accepted, setAccepted] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deadline, setDeadline] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [resent, setResent] = useState(false);
  const submission = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => () => submission.current?.abort(), []);
  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [deadline]);
  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>('input:not([readonly]):not([type="checkbox"])')?.focus({ preventScroll: true });
  }, [challenge?.isNewCustomer, Boolean(challenge)]);

  async function requestCode() {
    if (busy) return;
    setBusy(true); setError('');
    const controller = new AbortController(); submission.current = controller;
    try {
      const { data } = await accountApi<{ data: Challenge }>('/auth/otp/request', { method: 'POST', signal: controller.signal, body: JSON.stringify({ email: email.trim(), termsAccepted: accepted }) });
      if (controller.signal.aborted) return;
      setChallenge(data); setCode(''); setDeadline(Date.now() + data.resendAfter * 1000); setResent(Boolean(challenge));
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to send a code. Please try again.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!challenge) { await requestCode(); return; }
    if (busy) return;
    setBusy(true); setError('');
    const controller = new AbortController(); submission.current = controller;
    try {
      const { data } = await accountApi<{ data: { user: UserDto; token: string } }>('/auth/otp/verify', {
        method: 'POST', signal: controller.signal,
        body: JSON.stringify({ challengeId: challenge.challengeId, code, ...(challenge.isNewCustomer ? { firstName: firstName.trim(), lastName: lastName.trim(), newsletterOptIn: newsletter } : {}) }),
      });
      if (controller.signal.aborted) return;
      useAuthStore.getState().setAuth(data.user, data.token);
      onSuccess(data.user);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }

  function back() {
    submission.current?.abort(); setBusy(false); setChallenge(null); setCode(''); setError(''); setResent(false);
  }

  return <div className="email-otp-access">
    {challenge && <button className="otp-back" type="button" onClick={back} aria-label="Back to email"><span aria-hidden="true">‹</span> Back</button>}
    <header className="otp-heading">
      <h2 id={titleId}>{!challenge ? 'Login or Signup' : challenge.isNewCustomer ? 'Welcome to Mangesh Mahadev!' : 'Welcome back'}</h2>
      <p id={descriptionId}>{!challenge ? 'To quickly find your favourite items, saved addresses and payments.' : challenge.isNewCustomer ? 'Let’s get to know you and create your account.' : 'Enter your email verification code to sign in.'}</p>
    </header>
    <form ref={formRef} onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy}>
        {!challenge ? <>
          <label className="otp-field" htmlFor={`${id}-email`}>Email id <span aria-hidden="true">*</span><input id={`${id}-email`} type="email" required autoComplete="email" maxLength={255} value={email} onChange={event => setEmail(event.target.value)} /></label>
          <label className="otp-check"><input type="checkbox" required checked={accepted} onChange={event => setAccepted(event.target.checked)} /><span>I agree to the <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms of Use</Link> and acknowledge the <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span></label>
        </> : <>
          {challenge.isNewCustomer && <div className="otp-name-row">
            <label className="otp-field" htmlFor={`${id}-first`}>First name <span aria-hidden="true">*</span><input id={`${id}-first`} autoComplete="given-name" required maxLength={100} value={firstName} onChange={event => setFirstName(event.target.value)} /></label>
            <label className="otp-field" htmlFor={`${id}-last`}>Last name <span aria-hidden="true">*</span><input id={`${id}-last`} autoComplete="family-name" required maxLength={100} value={lastName} onChange={event => setLastName(event.target.value)} /></label>
          </div>}
          <div className="otp-email-summary"><div><span>Email</span><p>{challenge.email}</p></div><button type="button" onClick={back}>Change</button></div>
          <p className="otp-delivery" role="status">{challenge.delivery === 'development' ? 'Email delivery is not connected yet. For this local preview, enter any six-digit code.' : `${resent ? 'A new code has been sent' : 'We sent a six-digit code'} to your email. It expires in 10 minutes.`}</p>
          <label className="otp-field" htmlFor={`${id}-code`}>Enter OTP <span aria-hidden="true">*</span><input className="otp-code" id={`${id}-code`} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" title="Enter a six-digit code" required minLength={6} maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
          <div className="otp-resend"><span aria-live="off">{seconds > 0 ? `Resend code in ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` : 'Didn’t receive a code?'}</span><button type="button" disabled={seconds > 0 || busy} onClick={requestCode}>Resend code</button></div>
          {challenge.isNewCustomer && <label className="otp-check otp-newsletter"><input type="checkbox" checked={newsletter} onChange={event => setNewsletter(event.target.checked)} /><span>I would like to receive the newsletter <small>(optional)</small></span></label>}
        </>}
        {error && <p className="otp-error" role="alert">{error}</p>}
        <button className="otp-submit" type="submit" disabled={busy || (!challenge && !accepted)}>{busy ? 'Please wait…' : !challenge ? 'Continue' : challenge.isNewCustomer ? 'Create Account' : 'Sign in'}</button>
      </fieldset>
    </form>
    {challenge?.isNewCustomer && <p className="otp-privacy-note">Your details help us look after your account. Read our <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</p>}
  </div>;
}
