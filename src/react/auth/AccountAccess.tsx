'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authReturnPath } from '../../lib/auth-return';
import { AuthFrame } from './AuthFrame';
import { EmailOtpAccess } from './EmailOtpAccess';

export function AccountAccess({ mode: _mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => { setNext(authReturnPath()); }, []);
  useEffect(() => { if (token && next) router.replace(next); }, [token, next, router]);
  return <AuthFrame title="Login or Signup" description="Access your account with an email code." hideHeading>
    <EmailOtpAccess onSuccess={() => router.replace(next || '/account')} />
  </AuthFrame>;
}
