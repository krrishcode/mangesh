'use client';

import Link from 'next/link';
import { useRef } from 'react';
import type { MensProduct } from '../data/mensCollection';
import { effectivePrice, formatPrice } from '../lib/product';

export function ProductCarousel({ products }: { products: MensProduct[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * (track.clientWidth + 24),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };

  if (!products.length) return null;
  return (
    <section
      id="new-season"
      className="home-section"
      aria-labelledby="featured-title"
    >
      <div className="home-container">
        <div className="home-section-header">
          <h2 id="featured-title" className="home-heading">
            Featured products
          </h2>
          <div className="flex items-center gap-5">
            <Link href="/shop" className="home-action">
              View all clothing
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => scroll(-1)}
                aria-label="Previous products"
                className="home-action home-action-icon"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                onClick={() => scroll(1)}
                aria-label="Next products"
                className="home-action home-action-icon"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
        <div
          ref={trackRef}
          tabIndex={0}
          aria-label="Featured products"
          className="home-product-track overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {products.map((product) => (
            <article key={product.id} className="min-w-0 snap-start">
              <Link
                href={`/products/${product.slug}`}
                aria-label={`View ${product.title}`}
                className="group relative mb-3 block aspect-[2/3] overflow-hidden bg-[#ECE8E1]"
              >
                <img
                  src={product.imageFront}
                  alt={product.title}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
                {product.imageDetail && (
                  <img
                    src={product.imageDetail}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover object-top opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
                  />
                )}
              </Link>
              <h3 className="home-label min-h-[42px]">
                <Link
                  href={`/products/${product.slug}`}
                  className="hover:text-primary-foreground"
                >
                  {product.title}
                </Link>
              </h3>
              <p className="home-label mt-2">
                {formatPrice(effectivePrice(product))}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
