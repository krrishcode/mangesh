'use client';

import { useEffect, useId, useRef } from 'react';
import type { UserDto } from '../../types';
import { EmailOtpAccess } from './EmailOtpAccess';
import '../../styles/auth.css';

export function CheckoutAuthDialog({ initialEmail, onClose, onSuccess }: {
  initialEmail: string;
  onClose: () => void;
  onSuccess: (user: UserDto) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLInputElement>('input[type="email"]')?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return <dialog
    ref={dialogRef}
    className="checkout-auth-dialog"
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); closeRef.current(); }}
    onClick={event => { if (event.target === event.currentTarget) closeRef.current(); }}
  >
    <div className="checkout-auth-content">
      <button type="button" className="checkout-auth-close" onClick={onClose} aria-label="Close sign in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
      </button>
      <EmailOtpAccess initialEmail={initialEmail} titleId={titleId} descriptionId={descriptionId} onSuccess={onSuccess} />
    </div>
  </dialog>;
}
