'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../lib/api';

export const LoginPage: React.FC = () => {
  const router = useRouter();
  const { setAuth, token } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && token && typeof window !== 'undefined') {
      router.replace('/account');
    }
  }, [token, hydrated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetchApi<{ success: boolean; data: { user: any; token: string }; error?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      setAuth(res.data.user, res.data.token);
      router.replace('/account');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white border border-[#EAE3DB] p-8 md:p-12 shadow-sm rounded-lg">
        <h1 className="font-serif-luxury text-2xl tracking-widest text-[#333333] text-center uppercase mb-8">Sign In</h1>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-sans-clean">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333] mb-2">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333]">Password</label>
              <Link href="/forgot-password" className="text-[10px] text-gray-500 hover:text-[#4A0E17] uppercase tracking-widest">Forgot?</Link>
            </div>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#333333] text-white py-4 text-xs font-sans-clean uppercase tracking-widest hover:bg-[#4A0E17] transition-colors mt-8">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-8 text-center text-sm font-sans-clean font-light text-gray-500">
          Don't have an account? <Link href="/register" className="text-[#333333] font-medium hover:text-[#4A0E17]">Create Account</Link>
        </div>
      </div>
    </div>
  );
};
