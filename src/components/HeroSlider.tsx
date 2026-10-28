'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { HERO_SLIDES } from '../data/mensCollection';

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isInView, setIsInView] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = document.querySelector('.site-header');
    if (!section || !header) return;
    const updateHeaderHeight = () => {
      section.style.setProperty(
        '--hero-header-height',
        `${header.getBoundingClientRect().height}px`
      );
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    const updateMotionPreference = () => {
      if (motionPreference.matches) setIsPlaying(false);
    };
    const updateVisibility = () => setIsPageVisible(!document.hidden);
    updateMotionPreference();
    updateVisibility();
    motionPreference.addEventListener('change', updateMotionPreference);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      motionPreference.removeEventListener('change', updateMotionPreference);
      document.removeEventListener('visibilitychange', updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      !isPlaying ||
      isHovered ||
      !isPageVisible ||
      !isInView ||
      HERO_SLIDES.length < 2
    )
      return;
    const timer = window.setTimeout(() => {
      setCurrentSlide((previous) => (previous + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [currentSlide, isPlaying, isHovered, isPageVisible, isInView]);

  function changeSlide(direction: number) {
    setCurrentSlide(
      (previous) =>
        (previous + direction + HERO_SLIDES.length) % HERO_SLIDES.length
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Mangesh Mahadev campaign"
      aria-roledescription="carousel"
      tabIndex={0}
      className="hero-slider w-full bg-white touch-pan-y focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setIsHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setIsHovered(false);
      }}
      onFocusCapture={(event) => {
        if (!(event.target as HTMLElement).closest('[data-rotation-control]')) setIsPlaying(false);
      }}
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
      onTouchCancel={() => {
        touchStart.current = null;
      }}
    >
      <div
        className="hero-media relative isolate w-full overflow-hidden bg-[#21180F]"
        aria-live={isPlaying ? 'off' : 'polite'}
      >
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            aria-hidden={index !== currentSlide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${HERO_SLIDES.length}`}
            className={`absolute inset-0 transition-opacity duration-[650ms] motion-reduce:transition-none ${
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
              style={{
                objectPosition:
                  slide.id === 'slide-1' ? '70% center' : 'center',
              }}
            />
          </div>
        ))}
      </div>
      <div
        role="group"
        aria-label="Choose campaign image"
        className="flex h-11 items-center justify-center gap-2"
      >
        <button
          type="button"
          data-rotation-control
          onClick={() => setIsPlaying((playing) => !playing)}
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          className="flex h-11 w-11 cursor-pointer items-center justify-center text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            {isPlaying ? (
              <path d="M5 3v10M11 3v10" />
            ) : (
              <path d="m5 3 7 5-7 5V3Z" />
            )}
          </svg>
        </button>
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === currentSlide ? 'true' : undefined}
            onClick={() => setCurrentSlide(index)}
            className="flex h-11 min-w-6 cursor-pointer items-center justify-center rounded-full px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          >
            <span
              aria-hidden="true"
              className={`h-px w-7 ${
                index === currentSlide ? 'bg-primary' : 'bg-[#CFD5DC]'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
