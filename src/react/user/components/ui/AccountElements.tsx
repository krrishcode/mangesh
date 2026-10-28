'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AccountIcon } from './AccountIcon';

export function AccountEmpty({ title, children, icon = 'bag' }: { title: string; children: ReactNode; icon?: 'bag' | 'heart' | 'pin' | 'calendar' }) {
  return <div className="account-empty"><span className="account-empty-icon"><AccountIcon name={icon} /></span><h2>{title}</h2><div>{children}</div></div>;
}
export function AccountFeedback({ message, error = false }: { message?: string; error?: boolean }) {
  return message ? <p className={`account-feedback${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{message}</p> : null;
}
export function AccountLoading() {
  return <div className="account-loading" role="status" aria-label="Loading account details"><span /><span /><span /><p>Loading…</p></div>;
}
export function AccountError({ retry }: { retry: () => void }) {
  return <div className="account-error" role="alert"><h2>We couldn’t load these details</h2><p>Please try again in a moment.</p><button type="button" className="account-button secondary" onClick={retry}>Try again</button></div>;
}
export function AccountDialog({ title, onClose, children, busy = false }: { title: string; onClose: () => void; children: ReactNode; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="account-dialog" aria-labelledby={titleId} aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) closeRef.current(); }} onClose={() => { if (!busy) closeRef.current(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="account-dialog-inner"><header><h2 id={titleId}>{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose}><AccountIcon name="close" /></button></header><fieldset disabled={busy} className="account-dialog-fields">{children}</fieldset></div>
  </dialog>;
}
