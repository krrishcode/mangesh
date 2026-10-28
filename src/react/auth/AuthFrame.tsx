'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import '../../styles/auth.css';
export function AuthFrame({ title, description, children, mode, next = '/account', hideHeading = false }: { title: string; description: string; children: ReactNode; mode?: 'login' | 'register'; next?: string; hideHeading?: boolean }) {
  return <main id="main" className="auth-page"><div className="auth-layout"><aside className="auth-image" aria-label="Mangesh Mahadev collection"><img src="/images/hero/sunlit-courtyard.webp" alt="" /><div><span>MANGESH MAHADEV</span><p>A place for your favourites.</p><Link href="/shop">Explore the collection</Link></div></aside><section className="auth-content"><div className="auth-inner">{mode && <nav className="auth-tabs" aria-label="Account access"><Link href={`/login?next=${encodeURIComponent(next)}`} aria-current={mode === 'login' ? 'page' : undefined}>Sign in</Link><Link href={`/register?next=${encodeURIComponent(next)}`} aria-current={mode === 'register' ? 'page' : undefined}>Create account</Link></nav>}{hideHeading ? <h1 className="sr-only">{title}</h1> : <header><h1>{title}</h1><p>{description}</p></header>}{children}</div></section></div></main>;
}
