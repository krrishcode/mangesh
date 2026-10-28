import type { MetadataRoute } from 'next';

const disallowPaths = [
  '/admin',
  '/account',
  '/api',
  '/cart',
  '/checkout',
  '/track-order',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/+$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: disallowPaths }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
