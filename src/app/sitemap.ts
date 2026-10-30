import type { MetadataRoute } from 'next';

import { getCatalogCategories, getCatalogProducts } from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

const staticPaths: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/runway', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/weddings', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/celebrities', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/terms-and-conditions', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/+$/, '');

  const entries: MetadataRoute.Sitemap = staticPaths.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // The catalogue lives in the database; if it is unreachable the static
  // entries above still ship a valid sitemap.
  try {
    const [products, categories] = await Promise.all([
      getCatalogProducts(),
      getCatalogCategories(),
    ]);
    entries.push(
      ...categories.map((category) => ({
        url: `${siteUrl}/collections/${category.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...products.map((product) => ({
        url: `${siteUrl}/products/${product.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    );
  } catch {
    // Keep the sitemap to static routes when the database is unavailable.
  }

  return entries;
}
