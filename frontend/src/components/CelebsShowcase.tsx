'use client';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { CELEB_LOOKS } from '../data/celebs';

const SLIDES = [...CELEB_LOOKS, ...CELEB_LOOKS.slice(0, 2)];

export const CelebsShowcase: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex]);

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(CELEB_LOOKS.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex(CELEB_LOOKS.length - 1);
      }, 20);
    } else {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleTransitionEnd = () => {
    if (currentIndex >= CELEB_LOOKS.length) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  const activeIndex = currentIndex % CELEB_LOOKS.length;

  return (
    <section id="celebs" className="py-20 bg-[#FAF8F5]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Clean Minimalist Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.14em] text-[#333333] font-light uppercase">
            CELEBS IN MANGESH MAHADEV
          </h2>
          <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] tracking-[0.06em] mt-3 font-light normal-case">
            Iconic gentlemen celebrated in handcrafted couture from our atelier.
          </p>
        </div>

        {/* Interactive Auto-Sliding 2-Card Banner Carousel */}
        <div 
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 shadow-md border border-gray-200/80 flex items-center justify-center text-gray-700 hover:text-white hover:bg-[#4A0E17] hover:border-[#4A0E17] transition-all duration-300"
            aria-label="Previous Celebrity Look"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 shadow-md border border-gray-200/80 flex items-center justify-center text-gray-700 hover:text-white hover:bg-[#4A0E17] hover:border-[#4A0E17] transition-all duration-300"
            aria-label="Next Celebrity Look"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Overflow Hidden Viewport */}
          <div className="overflow-hidden">
            <div
              className={`flex [--slide-step:100%] sm:[--slide-step:50%] ${
                isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''
              }`}
              style={{
                transform: `translateX(calc(-1 * var(--slide-step) * ${currentIndex}))`,
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {SLIDES.map((celeb, idx) => (
                <div
                  key={`${celeb.id}-${idx}`}
                  className="w-full sm:w-1/2 shrink-0 px-3 sm:px-5 text-center group block"
                >
                  <div className="relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-4 shadow-sm">
                    <img
                      src={celeb.image}
                      alt={`${celeb.celebName} in ${celeb.outfitName}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Minimal Text Below Image */}
                  <h3
                    className="font-serif-luxury text-[13px] tracking-[0.08em] font-normal text-[#333333] uppercase group-hover:text-[#4A0E17] transition-colors w-full h-[18px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={celeb.celebName}
                  >
                    {celeb.celebName}
                  </h3>
                  <p className="font-sans-clean text-[10px] sm:text-[11px] text-[#333333] tracking-[0.06em] mt-1 font-light normal-case">
                    {celeb.occasion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {CELEB_LOOKS.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(dotIdx);
                }}
                className={`transition-all duration-300 rounded-full ${
                  activeIndex === dotIdx
                    ? 'w-7 h-1.5 bg-[#4A0E17]'
                    : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Centered Minimalist CTA Button Matching Anita Dongre */}
        <div className="text-center mt-12">
          <Link
            href="/celebrities"
            className="inline-block px-10 py-3.5 border border-[#1A1A1A] text-[#333333] hover:bg-[#4A0E17] hover:border-[#4A0E17] hover:text-white transition-all text-[11px] font-medium tracking-[0.20em] uppercase"
          >
            EXPLORE NOW
          </Link>
        </div>

      </div>
    </section>
  );
};
