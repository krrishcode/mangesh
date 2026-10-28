'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Category = { id: string | number; name: string; slug: string };

const headingClass = 'text-[10px] font-medium uppercase tracking-[0.24em] text-white/60';
const linkClass =
  'text-white/75 transition-colors hover:text-white hover:underline hover:underline-offset-4 hover:decoration-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A880]';

export function FooterCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    fetch('/api/catalog')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load catalogue');
        return response.json();
      })
      .then((data: { categories?: Category[] }) => {
        if (isCurrent && Array.isArray(data.categories)) setCategories(data.categories);
      })
      .catch(() => {
        if (isCurrent) setFailed(true);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <nav aria-label="Categories">
      <h2 className={headingClass}>Categories</h2>
      {categories.length > 0 ? (
        <ul className="mt-5 columns-2 gap-6 text-[13px] [&>li]:mb-3">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={`/collections/${category.slug}`} className={linkClass}>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-[13px] text-white/55" role="status">
          {failed ? (
            <Link href="/shop" className={linkClass}>
              Browse all clothing
            </Link>
          ) : (
            'Loading categories…'
          )}
        </p>
      )}
    </nav>
  );
}
