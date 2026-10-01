'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { HERO_SLIDES } from '../data/mensCollection';

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function changeSlide(direction: number) {
    setCurrentSlide((previous) => (
      previous + direction + HERO_SLIDES.length
    ) % HERO_SLIDES.length);
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer = window.setInterval(() => {
      if (document.hidden || reducedMotion.matches || sectionRef.current?.matches(':hover, :focus-within')) return;
      setCurrentSlide((previous) => (previous + 1) % HERO_SLIDES.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Mangesh Mahadev campaign"
      aria-roledescription="carousel"
      tabIndex={0}
      className="w-full bg-[#FAF8F5] touch-pan-y focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#C5A880]"
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        changeSlide(event.key === 'ArrowRight' ? 1 : -1);
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return;
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
          changeSlide(deltaX < 0 ? 1 : -1);
        }
      }}
      onTouchCancel={() => { touchStart.current = null; }}
    >
      <div className="relative isolate aspect-[1672/941] w-full overflow-hidden bg-[#21180F]">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            aria-hidden={index !== currentSlide}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
              index === currentSlide ? 'z-10 opacity-100' : 'z-0 opacity-0'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="100vw"
              preload={index === 0}
              loading={index === 0 ? undefined : 'eager'}
              draggable={false}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div
        role="group"
        aria-label="Choose campaign image"
        className="flex h-14 items-center justify-center gap-1 sm:h-16"
      >
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === currentSlide ? 'true' : undefined}
            onClick={() => setCurrentSlide(index)}
            className="flex h-11 min-w-6 cursor-pointer items-center justify-center rounded-full px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17]"
          >
            <span
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                index === currentSlide ? 'w-7 bg-[#4A0E17]' : 'w-1.5 bg-[#CFD5DC]'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
