'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { CELEB_LOOKS } from '../data/celebs';

export function CelebsShowcase() {
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

  return (
    <section
      id="celebs"
      className="home-section"
      aria-labelledby="celebs-title"
    >
      <div className="home-container">
        <div className="home-section-header">
          <h2 id="celebs-title" className="home-heading">
            Seen in Mangesh Mahadev
          </h2>
          <div className="flex items-center gap-5">
            <Link href="/celebrities" className="home-action">
              View all looks
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => scroll(-1)}
                aria-label="Previous celebrity looks"
                className="home-action home-action-icon"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                onClick={() => scroll(1)}
                aria-label="Next celebrity looks"
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
          aria-label="Celebrity looks"
          className="home-look-track overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {CELEB_LOOKS.map((celeb) => (
            <figure key={celeb.id} className="min-w-0 snap-start">
              <div className="mb-3 aspect-[2/3] overflow-hidden bg-[#ECE8E1]">
                <img
                  src={celeb.image}
                  alt={`${celeb.celebName} in ${celeb.outfitName}`}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <figcaption>
                <h3 className="home-label">{celeb.celebName}</h3>
                <p className="mt-1 text-xs text-[#706B65]">{celeb.occasion}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
