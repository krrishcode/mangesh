import React, { useState } from 'react';
import { useAuthStore } from '../../../../stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface AdminLoginViewProps {
  onSuccess: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess }) => {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both administrative email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Authentication failed. Please check your credentials.');
      }

      const { user, token } = data.data || {};

      if (!user || user.role !== 'admin') {
        throw new Error('Access Denied: This account does not have administrator privileges.');
      }

      // Store in auth store
      setAuth(user, token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during administrative login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1C1917 0%, #0C0A09 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px 16px',
      color: '#FAFAF9',
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: '#141210',
        borderRadius: 12,
        border: '1px solid #292524',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
      }}>
        {/* Top Header Bar */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: '1px solid #24201D',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'rgba(74, 14, 23, 0.4)',
            border: '1px solid rgba(107, 29, 42, 0.5)',
            marginBottom: 16,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#22C55E',
              display: 'inline-block',
              boxShadow: '0 0 8px #22C55E',
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FCA5A5',
            }}>
              Enterprise Console
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Inter', serif",
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: '0.12em',
            margin: '0 0 6px',
            color: '#FFFFFF',
          }}>
            SHRUTI MANGESH
          </h1>
          <p style={{
            fontSize: 12,
            color: '#A8A29E',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Administrative Security Gateway
          </p>
        </div>

        {/* Login Form Body */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              color: '#FCA5A5',
              fontSize: 12,
              lineHeight: 1.45,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 500,
                color: '#D6D3D1',
                marginBottom: 6,
                letterSpacing: '0.02em',
              }}>
                Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: 8,
                    background: '#1C1917',
                    border: '1px solid #292524',
                    color: '#FAFAF9',
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#6B1D2A')}
                  onBlur={(e) => (e.target.style.borderColor = '#292524')}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#78716C"
                  strokeWidth="2"
                  style={{ position: 'absolute', left: 12, top: 12 }}
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#D6D3D1',
                  letterSpacing: '0.02em',
                }}>
                  Security Key / Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 38px',
                    borderRadius: 8,
                    background: '#1C1917',
                    border: '1px solid #292524',
                    color: '#FAFAF9',
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#6B1D2A')}
                  onBlur={(e) => (e.target.style.borderColor = '#292524')}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#78716C"
                  strokeWidth="2"
                  style={{ position: 'absolute', left: 12, top: 12 }}
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 10,
                    background: 'none',
                    border: 'none',
                    color: '#78716C',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#A8A29E' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#6B1D2A' }}
                />
                Keep console session active
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '12px 20px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4A0E17 0%, #2D080E 100%)',
                border: '1px solid #6B1D2A',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(74, 14, 23, 0.4)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Sign In to Enterprise Console'
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div style={{
            marginTop: 24,
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 8,
            border: '1px dashed #292524',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 11, color: '#78716C' }}>
              <div>Demo Admin: <span style={{ color: '#D6D3D1' }}>admin@example.com</span></div>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FAFAF9',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Autofill
            </button>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div style={{
          padding: '14px 24px',
          background: '#0D0B0A',
          borderTop: '1px solid #1E1B18',
          fontSize: 11,
          color: '#57534E',
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}>
          Protected System • Unauthorized Access Prohibited
        </div>
      </div>
    </div>
  );
};
