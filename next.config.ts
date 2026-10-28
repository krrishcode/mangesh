import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Next.js injects inline hydration scripts and Tailwind emits style attributes,
// so inline script/style remain allowed. External origins are limited to Google
// Identity Services (optional sign-in), the image CDN and signed R2 uploads.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://accounts.google.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://cdn.mangeshmahadev.com",
  "font-src 'self' data:",
  "media-src 'self' https://cdn.mangeshmahadev.com",
  `connect-src 'self' https://accounts.google.com https://cdn.mangeshmahadev.com https://*.r2.cloudflarestorage.com${isDev ? ' ws: wss:' : ''}`,
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
  async redirects() {
    return [
      { source: '/images/:path*', destination: 'https://cdn.mangeshmahadev.com/images/:path*', permanent: true },
      { source: '/products/:folder/:file', destination: 'https://cdn.mangeshmahadev.com/products/:folder/:file', permanent: true },
      { source: '/videos/:path*', destination: 'https://cdn.mangeshmahadev.com/videos/:path*', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
