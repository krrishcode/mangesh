'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../lib/api';

export const RegisterPage: React.FC = () => {
  const { setAuth, token } = useAuthStore();
  const [name, setName] = useState('');
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
      window.location.href = '/account';
    }
  }, [token, hydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetchApi<{ success: boolean; data: { user: any; token: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      
      setAuth(res.data.user, res.data.token);
      window.location.href = '/account';
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white border border-[#EAE3DB] p-8 md:p-12 shadow-sm rounded-lg">
        <h1 className="font-serif-luxury text-2xl tracking-widest text-[#333333] text-center uppercase mb-8">Create Account</h1>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-sans-clean">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333] mb-2">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
          </div>
          <div>
            <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333] mb-2">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
          </div>
          <div>
            <label className="block font-sans-clean text-xs uppercase tracking-widest text-[#333333] mb-2">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b border-[#EAE3DB] bg-transparent pb-2 text-sm focus:outline-none focus:border-[#4A0E17]" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#333333] text-white py-4 text-xs font-sans-clean uppercase tracking-widest hover:bg-[#4A0E17] transition-colors mt-8">
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <div className="mt-8 text-center text-sm font-sans-clean font-light text-gray-500">
          Already have an account? <a href="/login" className="text-[#333333] font-medium hover:text-[#4A0E17]">Sign In</a>
        </div>
      </div>
    </div>
  );
};
