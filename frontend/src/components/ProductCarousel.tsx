'use client';

import Link from 'next/link';

import React, { useState, useRef } from 'react';
import { MENS_PRODUCTS, type MensProduct } from '../data/mensCollection';
import { useCartStore } from '../stores';

export const ProductCarousel: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<MensProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { addItem } = useCartStore();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: MensProduct, size?: string) => {
    addItem({
      product_id: product.id,
      quantity: 1,
      price: product.price,
      title: `${product.title} ${size ? `(Size ${size})` : ''}`,
      image_url: product.imageFront,
    });

    setAddedToast(`Added to bag`);
    setTimeout(() => setAddedToast(null), 3000);
    setSelectedProduct(null);
  };

  return (
    <section id="fw26" className="py-20 bg-[#FAF8F5]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative">
        
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-sm border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white transition"
          aria-label="Previous Products"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-sm border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white transition"
          aria-label="Next Products"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MENS_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="flex-none w-[260px] sm:w-[280px] lg:w-[calc(25%-1.5rem)] group cursor-pointer"
            >
              {/* Product Image Container with Link */}
              <Link href={`/products/${prod.id}`} className="block relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-3.5">
                <img
                  src={prod.imageFront}
                  alt={prod.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-opacity duration-500 group-hover:opacity-0"
                />
                <img
                  src={prod.imageDetail}
                  alt={`${prod.title} Detail`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </Link>

              {/* Text Typography Below Image Exactly Like Screenshot */}
              <div className="text-left">
                <Link href={`/products/${prod.id}`}>
                  <h3 className="font-serif-luxury text-[13px] tracking-[0.08em] text-[#333333] uppercase font-normal hover:text-[#4A0E17] transition-colors w-full h-[18px] overflow-hidden text-ellipsis whitespace-nowrap" title={prod.title}>
                    {prod.title}
                  </h3>
                </Link>
                <p className="font-sans-clean text-[11px] sm:text-xs text-[#444444] mt-1 font-light tracking-wider">
                  ₹{prod.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Centered Minimalist CTA Button Matching Anita Dongre */}
        <div className="text-center mt-10">
          <a
            href="#fw26"
            className="inline-block px-10 py-3.5 border border-[#1A1A1A] text-[#333333] hover:bg-[#4A0E17] hover:border-[#4A0E17] hover:text-white transition-all text-[11px] font-medium tracking-[0.20em] uppercase"
          >
            SHOP THE COLLECTION
          </a>
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative bg-white max-w-3xl w-full rounded-xs shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 text-xl text-gray-400 hover:text-black z-20 p-2"
            >
              ✕
            </button>

            {/* Modal Image */}
            <div className="h-full bg-gray-100 relative min-h-[350px]">
              <img
                src={selectedProduct.imageFront}
                alt={selectedProduct.title}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Modal Details */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-medium tracking-[0.20em] text-[#66141F] uppercase block mb-1">
                  {selectedProduct.category} • {selectedProduct.craft}
                </span>
                <h2 className="font-serif-luxury text-xl font-light text-gray-900 tracking-[0.10em] mb-2 uppercase">
                  {selectedProduct.title}
                </h2>
                <p className="text-base font-semibold text-[#4A0E17] mb-4">
                  ₹{selectedProduct.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>

                <p className="text-xs text-gray-600 leading-relaxed mb-6 font-light">
                  {selectedProduct.description}
                </p>

                {/* Fabric & Details */}
                <div className="bg-[#FAF5F6] p-3 rounded-xs text-[11px] text-gray-700 space-y-1 mb-6 border border-[#E8D6D9]">
                  <p><span className="font-semibold text-[#4A0E17]">Color:</span> {selectedProduct.color}</p>
                  <p><span className="font-semibold text-[#4A0E17]">Fabric:</span> {selectedProduct.fabric}</p>
                  <p><span className="font-semibold text-[#4A0E17]">Craftsmanship:</span> {selectedProduct.craft}</p>
                </div>

                {/* Size Selector */}
                <div className="mb-6">
                  <div className="flex justify-between items-center text-[11px] uppercase tracking-wider mb-2">
                    <span className="font-semibold text-gray-900">Select Size</span>
                    <a href="#size-guide" className="text-[#66141F] font-semibold underline">Size Guide</a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize(s);
                        }}
                        className={`px-3 py-2 text-xs font-semibold border transition ${
                          selectedSize === s
                            ? 'border-[#4A0E17] bg-[#4A0E17] text-white'
                            : 'border-gray-300 text-gray-700 hover:border-[#4A0E17]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add to Bag Action */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(selectedProduct, selectedSize);
                  }}
                  className="w-full py-3.5 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-[#66141F] transition shadow-md"
                >
                  ADD TO SHOPPING BAG
                </button>
                <p className="text-[10px] text-center text-gray-400">
                  Complimentary bespoke alterations available in our boutiques
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Added to Bag Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-xs tracking-wider animate-bounce border border-[#66141F]">
          <span>✨</span>
          <span>{addedToast}</span>
        </div>
      )}
    </section>
  );
};
