import React from 'react';
import { CELEB_LOOKS } from '../data/celebs';

export const CelebsShowcase: React.FC = () => {
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

        {/* 4-Column Clean Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {CELEB_LOOKS.map((celeb) => (
            <div
              key={celeb.id}
              className="group block text-center"
            >
              <div className="relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-4">
                <img
                  src={celeb.image}
                  alt={`${celeb.celebName} in ${celeb.outfitName}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>

              {/* Minimal Text Below Image */}
              <h3 className="font-serif-luxury text-[13px] tracking-[0.08em] font-normal text-[#333333] uppercase group-hover:text-[#4A0E17] transition-colors w-full h-[18px] overflow-hidden text-ellipsis whitespace-nowrap" title={celeb.celebName}>
                {celeb.celebName}
              </h3>
              <p className="font-sans-clean text-[10px] sm:text-[11px] text-[#333333] tracking-[0.06em] mt-1 font-light normal-case">
                {celeb.occasion}
              </p>
            </div>
          ))}
        </div>

        {/* Centered Minimalist CTA Button Matching Anita Dongre */}
        <div className="text-center mt-12">
          <a
            href="/celebrities"
            className="inline-block px-10 py-3.5 border border-[#1A1A1A] text-[#333333] hover:bg-[#4A0E17] hover:border-[#4A0E17] hover:text-white transition-all text-[11px] font-medium tracking-[0.20em] uppercase"
          >
            EXPLORE NOW
          </a>
        </div>

      </div>
    </section>
  );
};
