import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Next.js injects inline hydration scripts and Tailwind emits style attributes,
// so inline script/style remain allowed. External origins are limited to Google
// Identity Services (optional sign-in) and Vercel Blob (admin uploads).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://accounts.google.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://*.blob.vercel-storage.com",
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self' https://accounts.google.com https://vercel.com https://*.blob.vercel-storage.com${isDev ? ' ws: wss:' : ''}`,
  "frame-src 'self' https://accounts.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
    : []),
];

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  poweredByHeader: false,
  images: { unoptimized: true },
  serverExternalPackages: ['pg', 'nodemailer', 'google-auth-library'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
