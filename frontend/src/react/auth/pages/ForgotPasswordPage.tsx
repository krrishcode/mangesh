'use client';

import React, { useState } from 'react';
import { fetchApi } from '../../../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetchApi<{ success: boolean; message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      setStatus('success');
      // In dev, the token is returned directly so we can simulate the email flow.
      if (res.resetToken) {
        setMessage(`Success. In development, click here to reset: /reset-password?token=${res.resetToken}`);
      } else {
        setMessage(res.message);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white border border-[#EAE3DB] p-8 md:p-12 shadow-sm rounded-lg">
        <h1 className="font-serif-luxury text-2xl tracking-widest text-[#333333] text-center uppercase mb-4">Reset Password</h1>
        <p className="text-center font-sans-clean font-light text-sm text-gray-500 mb-8">Enter your email and we'll send you instructions to reset your password.</p>
        
        {status === 'error' && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-sans-clean">{message}</div>}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 text-sm font-sans-clean break-all">
            {message.includes('/reset-password') ? (
              <a href={message.split('click here to reset: ')[1]} className="underline text-emerald-900 font-medium">{message.split('click here to reset: ')[1]}</a>
            ) : message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333] mb-2">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
          </div>
          <button disabled={status === 'loading'} type="submit" className="w-full bg-[#333333] text-white py-4 text-xs font-sans-clean uppercase tracking-widest hover:bg-[#4A0E17] transition-colors mt-8">
            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="mt-8 text-center text-sm font-sans-clean font-light text-gray-500">
          Remember your password? <a href="/login" className="text-[#333333] font-medium hover:text-[#4A0E17]">Sign In</a>
        </div>
      </div>
    </div>
  );
};
