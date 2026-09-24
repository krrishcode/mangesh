'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      
      setStatus('success');
      setMessage(res.message);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to reset password');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white border border-[#EAE3DB] p-8 md:p-12 shadow-sm rounded-lg text-center">
          <h1 className="font-serif-luxury text-2xl tracking-widest text-[#333333] uppercase mb-4">Password Updated</h1>
          <p className="font-sans-clean font-light text-sm text-gray-500 mb-8">{message}</p>
          <a href="/login" className="inline-block w-full bg-[#333333] text-white py-4 text-xs font-sans-clean uppercase tracking-widest hover:bg-[#4A0E17] transition-colors">
            Sign In Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white border border-[#EAE3DB] p-8 md:p-12 shadow-sm rounded-lg">
        <h1 className="font-serif-luxury text-2xl tracking-widest text-[#333333] text-center uppercase mb-8">New Password</h1>
        
        {status === 'error' && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-sans-clean">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!token && (
            <div>
              <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333] mb-2">Reset Token</label>
              <input type="text" required value={token} onChange={(e) => setToken(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
            </div>
          )}
          <div>
            <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333] mb-2">New Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
          </div>
          <button disabled={status === 'loading'} type="submit" className="w-full bg-[#333333] text-white py-4 text-xs font-sans-clean uppercase tracking-widest hover:bg-[#4A0E17] transition-colors mt-8">
            {status === 'loading' ? 'Saving...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
