'use client';

import React, { useState, useEffect } from 'react';
import { HERO_SLIDES } from '../data/mensCollection';

export const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative w-full h-[85vh] min-h-[580px] max-h-[900px] bg-[#121212] overflow-hidden">
      {/* Background Slides */}
      {HERO_SLIDES.map((item, idx) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <img
            src={item.imageDesktop}
            alt={item.title}
            className="w-full h-full object-cover object-top scale-105 transition-transform duration-[8000ms] ease-out transform"
            style={{
              transform: idx === currentSlide ? 'scale(1)' : 'scale(1.08)',
            }}
          />
          {/* Subtle Luxury Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        </div>
      ))}

      {/* Hero Content Overlay */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 lg:pb-24">
        <div className="max-w-2xl text-white">
          <span className="inline-block text-[11px] sm:text-xs font-medium tracking-[0.28em] uppercase text-[#E0D7CD] mb-3">
            {slide.collection}
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.08em] text-white leading-[1.1] mb-4">
            {slide.title}
          </h2>
          <p className="font-serif-luxury text-base sm:text-xl text-gray-200 mb-8 font-light max-w-xl leading-relaxed">
            "{slide.subtitle}"
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={slide.ctaLink}
              className="px-8 py-3.5 bg-white text-black text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-[#B89F7E] hover:text-white transition shadow-lg inline-block"
            >
              {slide.ctaText}
            </a>
            {slide.secondaryCtaText && (
              <a
                href={slide.secondaryCtaLink}
                className="px-8 py-3.5 border border-white/80 text-white text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-white/10 transition backdrop-blur-xs inline-block"
              >
                {slide.secondaryCtaText}
              </a>
            )}
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 right-8 flex items-center gap-3 z-30">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all duration-300 ${
                i === currentSlide
                  ? 'w-10 h-1 bg-white'
                  : 'w-4 h-1 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
