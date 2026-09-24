'use client';

import React, { useState } from 'react';
import { MENS_PRODUCTS, type MensProduct } from '../data/mensCollection';
import { useCartStore } from '../stores';

interface ProductDetailProps {
  product?: MensProduct;
}

export const ProductDetailView: React.FC<ProductDetailProps> = ({ product: initialProduct }) => {
  const product: MensProduct = initialProduct || MENS_PRODUCTS[0];

  // Color variants support (cloth can have multiple colors with independent size mapping)
  const colorVariants: Array<{
    id?: string;
    color: string;
    colorHex: string;
    imageFront?: string;
    sizes: string[];
    inStockSizes: string[];
  }> = (() => {
    if (product.colorVariants) {
      try {
        const parsed = typeof product.colorVariants === 'string'
          ? JSON.parse(product.colorVariants)
          : product.colorVariants;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    // Default fallback: sample multi-colors for Product 102
    return [
      {
        id: 'var-beige',
        color: product.color || 'Beige',
        colorHex: product.colorHex || '#D6C7B2',
        imageFront: product.imageFront,
        sizes: ['38', '40', '42', '44', '46', '48'],
        inStockSizes: ['38', '40', '42', '44', '46'],
      },
      {
        id: 'var-black',
        color: 'Black',
        colorHex: '#1C1917',
        sizes: ['40', '44'],
        inStockSizes: ['40', '44'],
      },
      {
        id: 'var-blue',
        color: 'Royal Blue',
        colorHex: '#1E3A8A',
        sizes: ['38', '40'],
        inStockSizes: ['38'],
      },
    ];
  })();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colorVariants[0]?.color || product.color || 'Beige');
  const [selectedSize, setSelectedSize] = useState(colorVariants[0]?.sizes?.[0] || '38');

  const activeVariant = colorVariants.find(
    v => v.color.toLowerCase() === selectedColor.toLowerCase()
  ) || colorVariants[0];

  const numericSizes = (activeVariant?.sizes || ['38', '40', '42', '44', '46', '48']).map((s) => ({
    label: s,
    inStock: (activeVariant?.inStockSizes || []).includes(s),
  }));

  const productDeliveryOption = (product.deliveryMethod as string) || 'both';
  const canHome = productDeliveryOption === 'both' || productDeliveryOption === 'home';
  const canPickup = productDeliveryOption === 'both' || productDeliveryOption === 'pickup';
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'pickup'>(canHome ? 'home' : 'pickup');
  const [isWishlist, setIsWishlist] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  
  // Accordions open states (collapsed by default)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    details: false,
    stylist: false,
    delivery: false,
    disclaimer: false,
  });

  const [addedToast, setAddedToast] = useState(false);

  const { addItem } = useCartStore();

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    const targetVariant = colorVariants.find(v => v.color.toLowerCase() === newColor.toLowerCase());
    if (targetVariant && targetVariant.sizes && !targetVariant.sizes.includes(selectedSize)) {
      const firstInStock = targetVariant.sizes.find(s => targetVariant.inStockSizes.includes(s));
      setSelectedSize(firstInStock || targetVariant.sizes[0] || '38');
    }
  };

  const galleryImages = (Array.isArray(product.gallery) && product.gallery.length > 0)
    ? [
        activeVariant?.imageFront || product.imageFront,
        ...product.gallery.filter(img => img !== (activeVariant?.imageFront || product.imageFront))
      ].filter(Boolean) as string[]
    : [
        activeVariant?.imageFront || product.imageFront,
        product.imageDetail,
        'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=1400&sh=2100&sm=fit&strip=false',
        'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=1400&sh=2100&sm=fit&strip=false',
      ].filter(Boolean) as string[];

  const relatedProducts = MENS_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      quantity: 1,
      price: product.price,
      title: `${product.title} (Size ${selectedSize})`,
      image_url: product.imageFront,
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);
  };

  return (
    <div className="bg-[#FAF8F5] text-[#333333] pt-4 pb-16">
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Minimalist Breadcrumbs */}
        <nav className="font-sans-clean text-[10.5px] text-[#333333] mb-4 flex flex-wrap items-center gap-2 tracking-[0.14em] uppercase">
          <a href="/" className="hover:text-[#4A0E17] transition font-medium">Home</a>
          <span>/</span>
          <a href="/#fw26" className="hover:text-[#4A0E17] transition font-medium">MEN</a>
          <span>/</span>
          <a href="/#sherwanis" className="hover:text-[#4A0E17] transition font-medium">{product.category}</a>
          <span>/</span>
          <span className="text-[#333333] font-semibold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* 50:50 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_auto] lg:justify-center gap-8 lg:gap-14 items-start">
          
          {/* Left: Sticky Gallery — hugs its content so no dead band opens before the details */}
          <div className="lg:sticky lg:top-24 flex flex-col-reverse sm:flex-row gap-3.5 lg:gap-14">
            
            {/* Thumbnails list */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0 scrollbar-none lg:h-[calc(100vh-13rem)]">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[2/3] w-16 sm:w-20 shrink-0 overflow-hidden bg-[#ECE8E1] border transition-all ${
                    activeImageIndex === idx ? 'border-[#4A0E17] shadow-xs' : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover object-top" />
                </button>
              ))}
            </div>

            {/* Main Image Frame — 2:3 matches the source photography, and on desktop the
                height is bound to the viewport so the whole garment shows without scrolling
                or cropping; width then follows from the aspect ratio. */}
            <div className="flex-1 relative aspect-[2/3] overflow-hidden bg-[#ECE8E1] rounded-xs shadow-xs lg:w-auto lg:flex-none lg:h-[calc(100vh-13rem)]">
              <img
                src={galleryImages[activeImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105 cursor-zoom-in"
              />
              <span className="absolute top-3.5 left-3.5 bg-[#FAF8F5]/95 backdrop-blur-xs text-[#4A0E17] font-sans-clean text-[9.5px] font-semibold tracking-[0.25em] uppercase px-3 py-1.5 border border-[#E8D6D9]">
                {product.badge || 'FW26 RUNWAY'}
              </span>
            </div>
          </div>

          {/* Right: Product Content */}
          <div className="flex flex-col space-y-5 lg:max-w-[600px]">
            
            {/* Top Brand & Title & Share Node */}
            <div>
              <div className="flex justify-between items-start">
                <span className="font-heading text-[11px] sm:text-xs text-[#4A0E17] font-medium tracking-[0.20em] uppercase block mb-1">
Mangesh Mahadev
                </span>

                {/* Minimalist Share Icon Node */}
                <button
                  className="text-gray-500 hover:text-[#4A0E17] transition p-1"
                  aria-label="Share product"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              </div>

              {/* Title in Haute Couture Serif */}
              <h1 className="font-serif-luxury text-[26px] sm:text-[32px] lg:text-[36px] font-light text-[#333333] tracking-[0.06em] leading-tight uppercase mt-1">
                {product.title} - {selectedColor.toUpperCase()}
              </h1>

              {/* Price & Taxes */}
              <div className="mt-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif-luxury text-2xl sm:text-3xl font-normal text-[#333333] tracking-wider">
                    ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  {product.salePrice && product.salePrice < product.price && (
                    <span className="font-serif-luxury text-lg sm:text-xl text-[#888] line-through">
                      ₹{product.salePrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
                <p className="font-sans-clean text-[11px] text-[#333333] font-light tracking-[0.14em] uppercase mt-1">
                  MRP Inclusive of all taxes
                </p>
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="mt-4 space-y-2.5 font-sans-clean text-[15px] font-light leading-relaxed text-[#333333] tracking-[0.04em]">
                  {product.description.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Editorial Storytelling in Poetic Story Serif */}
            {product.editorialStory && (
              <div className="space-y-3 font-serif-story text-[13.5px] sm:text-[14.5px] text-[#3A3A3A] leading-relaxed font-light">
                {product.editorialStory.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>"{paragraph}"</p>
                ))}
              </div>
            )}

            {/* Colour Section */}
            <div className="pt-2">
              <div className="flex items-center gap-4">
                <span className="font-sans-clean text-[11px] text-[#222222] font-medium tracking-[0.14em] uppercase">Colour:</span>
                <div className="flex items-center gap-2.5">
                  {colorVariants.map((v) => {
                    const isSelected = selectedColor.toLowerCase() === v.color.toLowerCase();
                    return (
                      <div
                        key={v.color}
                        className={`p-0.5 rounded-full border transition-all ${
                          isSelected ? 'border-[#4A0E17] scale-110 shadow-xs' : 'border-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <button
                          onClick={() => handleColorChange(v.color)}
                          className="w-7 h-7 rounded-full block border border-white shadow-xs focus:outline-none cursor-pointer"
                          style={{ backgroundColor: v.colorHex }}
                          title={`Colour: ${v.color}`}
                          aria-label={`Colour: ${v.color}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <span className="font-sans-clean text-xs text-[#4A0E17] font-semibold">{selectedColor}</span>
              </div>
            </div>

            {/* Size Section */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-sans-clean text-[11px] text-[#222222] font-medium tracking-[0.14em] uppercase min-w-[40px]">Size:</span>
                  <div className="flex flex-wrap gap-2">
                    {numericSizes.map((s) => (
                      <div key={s.label} className="relative">
                        <button
                          disabled={!s.inStock}
                          onClick={() => setSelectedSize(s.label)}
                          className={`w-11 h-10 flex items-center justify-center font-sans-clean text-xs transition-all border ${
                            !s.inStock
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                              : selectedSize === s.label
                              ? 'border-[#4A0E17] bg-[#4A0E17] text-white font-semibold shadow-xs'
                              : 'border-[#D5CEC5] bg-white text-gray-800 hover:border-black'
                          }`}
                        >
                          {s.label}
                        </button>
                        
                        {/* Diagonal Strike-through for Out of Stock */}
                        {!s.inStock && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none text-gray-300" viewBox="0 0 44 40">
                            <line x1="0" y1="40" x2="44" y2="0" stroke="currentColor" strokeWidth="1" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* View Size Guide on the Right */}
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="font-sans-clean text-[10px] text-[#333333] font-medium underline tracking-[0.14em] uppercase self-end sm:self-auto hover:text-[#4A0E17] transition"
                >
                  View Size Guide
                </button>
              </div>
            </div>

            {/* Delivery Method Radio Selector */}
            <div className="pt-2">
              <span className="font-sans-clean text-[11px] text-[#222222] font-medium tracking-[0.14em] uppercase block mb-2">
                Delivery Method:
              </span>
              <div className="flex items-center gap-8 font-sans-clean text-xs tracking-wider">
                
                {/* Home Delivery Radio */}
                <label className={`flex items-center gap-2 ${canHome ? 'cursor-pointer text-gray-900 font-medium' : 'cursor-not-allowed text-gray-300'}`}>
                  <span className={`relative flex items-center justify-center w-4 h-4 rounded-full border ${deliveryMethod === 'home' && canHome ? 'border-[#997950]' : 'border-gray-300'}`}>
                    {deliveryMethod === 'home' && canHome && <span className="w-2 h-2 rounded-full bg-[#997950]" />}
                  </span>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="home"
                    disabled={!canHome}
                    checked={deliveryMethod === 'home' && canHome}
                    onChange={() => canHome && setDeliveryMethod('home')}
                    className="sr-only"
                  />
                  <span>Home Delivery {!canHome && '(Unavailable)'}</span>
                </label>

                {/* Store Pick-up Radio */}
                <label className={`flex items-center gap-2 ${canPickup ? 'cursor-pointer text-gray-900 font-medium' : 'cursor-not-allowed text-gray-300'}`}>
                  <span className={`relative flex items-center justify-center w-4 h-4 rounded-full border ${deliveryMethod === 'pickup' && canPickup ? 'border-[#997950]' : 'border-gray-300'}`}>
                    {deliveryMethod === 'pickup' && canPickup && <span className="w-2 h-2 rounded-full bg-[#997950]" />}
                  </span>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    disabled={!canPickup}
                    checked={deliveryMethod === 'pickup' && canPickup}
                    onChange={() => canPickup && setDeliveryMethod('pickup')}
                    className="sr-only"
                  />
                  <span>Store Pick-up {!canPickup && '(Unavailable)'}</span>
                </label>

              </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-3 space-y-2.5 font-sans-clean">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-[#4A0E17] text-white hover:bg-[#66141F] transition text-[11px] font-medium tracking-[0.22em] uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ADD TO CART</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Accordion Sections with Butter-Smooth Expand & Collapse */}
            <div className="pt-6 space-y-0 text-xs text-[#222222]">
              
              {/* ACCORDION 1: PRODUCT DETAILS */}
              <div className="border-t border-[#D5CEC5] py-4">
                <button
                  onClick={() => toggleSection('details')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base sm:text-lg font-medium tracking-[0.10em] uppercase text-[#333333] text-left cursor-pointer group"
                >
                  <span className="group-hover:text-[#4A0E17] transition-colors">PRODUCT DETAILS</span>
                  <span className="w-7 h-7 flex items-center justify-center text-[#333333] group-hover:text-[#4A0E17] transition-transform duration-300 ease-out">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ease-out ${openSections.details ? 'rotate-45 text-[#4A0E17]' : 'rotate-0'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.details ? 'grid-rows-[1fr] opacity-100 pt-3.5 pb-2' : 'grid-rows-[0fr] opacity-0 pt-0 pb-0'
                  }`}
                >
                  <div className="overflow-hidden space-y-2.5 font-sans-clean text-[11.5px] sm:text-xs leading-relaxed text-[#333333] tracking-wide">
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">Style Number:</span>
                      <span className="col-span-8 sm:col-span-9 font-normal text-[#333333]">{product.styleNumber || product.sku || 'F26MP8'}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">Measurements:</span>
                      <span className="col-span-8 sm:col-span-9 font-normal text-[#333333] whitespace-pre-line">
                        {product.measurements || "Sherwani Length - 110 cm (43.3 In)\nChuridar Fabric - 250 cm (2.5 Mtrs)\nDraped Stole - 250 cm (2.5 Mtrs)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">Content:</span>
                      <span className="col-span-8 sm:col-span-9 font-normal text-[#333333]">{product.fabricContent || '100% Silk + Lining : 100% Viscose'}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">No. of Components:</span>
                      <span className="col-span-8 sm:col-span-9 font-normal text-[#333333]">{product.componentsCount || 3}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">Wash Care:</span>
                      <span className="col-span-8 sm:col-span-9 font-normal text-[#333333]">{product.washCare || 'Dry Clean / Spot Clean'}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">Country of Origin:</span>
                      <span className="col-span-8 sm:col-span-9 font-normal text-[#333333]">{product.countryOfOrigin || 'India'}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">Name and Address of Manufacturer:</span>
                      <span className="col-span-8 sm:col-span-9 font-normal text-[#333333]">
                        {product.manufacturerAddress || 'House of Mangesh Mahadev Private Limited, Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India - 400701.'}
                      </span>
                    </div>

                    {product.styleNote && (
                      <div className="grid grid-cols-12 gap-2 pt-1">
                        <span className="col-span-4 sm:col-span-3 text-[#333333] font-medium">Style Note:</span>
                        <span className="col-span-8 sm:col-span-9 font-normal text-[#333333]">{product.styleNote}</span>
                      </div>
                    )}

                    <div className="pt-2 text-[#333333] italic font-serif-story text-[13.5px]">
                      Set Includes: {product.setIncludes || 'Hand-embroidered Sherwani, Churidar Fabric & Handcrafted Silk Stole'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACCORDION 2: CONTACT OUR STYLIST */}
              <div className="border-t border-[#D5CEC5] py-4">
                <button
                  onClick={() => toggleSection('stylist')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base sm:text-lg font-medium tracking-[0.10em] uppercase text-[#333333] text-left cursor-pointer group"
                >
                  <span className="group-hover:text-[#4A0E17] transition-colors">CONTACT OUR STYLIST</span>
                  <span className="w-7 h-7 flex items-center justify-center text-[#333333] group-hover:text-[#4A0E17] transition-transform duration-300 ease-out">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ease-out ${openSections.stylist ? 'rotate-45 text-[#4A0E17]' : 'rotate-0'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.stylist ? 'grid-rows-[1fr] opacity-100 pt-3 pb-2' : 'grid-rows-[0fr] opacity-0 pt-0 pb-0'
                  }`}
                >
                  <div className="overflow-hidden space-y-4 text-xs text-[#333333]">
                    <p className="font-sans-clean text-[12px] text-[#333333]">
                      Speak to our stylists for further assistance and queries.
                    </p>

                    {/* 4 Vector SVGs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-2 font-sans-clean text-[11px] text-[#222222] font-medium tracking-wide">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.14 6.344a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                        </svg>
                        <span>Customisation</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v9.375" />
                        </svg>
                        <span>Early Delivery</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <span>Product Preview</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.875 14.25l1.214 1.942a2.25 2.25 0 001.908 1.058h2.006c.77 0 1.49-.393 1.908-1.058l1.214-1.942M2.25 6.75h19.5M4.5 6.75v10.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V6.75M9 6.75V4.5a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0115 4.5v2.25" />
                        </svg>
                        <span>Fitting Assistance</span>
                      </div>
                    </div>

                    {/* 3 Pill Buttons */}
                    <div className="flex flex-wrap gap-2.5 pt-2 font-sans-clean">
                      <a
                        href="tel:+919999313366"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:border-[#4A0E17] hover:text-[#4A0E17] transition text-[11.5px] font-medium tracking-wide"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
                        </svg>
                        <span>+91 99993 13366</span>
                      </a>

                      <a
                        href="https://api.whatsapp.com/send?phone=919999313366&text=Hi!%20I%20want%20to%20inquire%20about%20Shruti%20Mangesh%20Menswear"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:border-[#4A0E17] hover:text-[#4A0E17] transition text-[11.5px] font-medium tracking-wide"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.073-1.045-.062-.317-.104-.707-.234-1.218-.456-2.152-.937-3.551-3.125-3.659-3.268-.107-.144-.868-1.157-.868-2.207 0-1.05.549-1.567.744-1.782.195-.215.426-.269.569-.269.143 0 .287.002.411.009.13.007.304-.049.475.362.179.43.612 1.493.666 1.603.054.11.09.239.018.383-.072.144-.108.233-.216.359-.108.126-.227.281-.324.377-.108.107-.221.224-.095.44.126.216.56 1.023 1.202 1.696.827.868 1.526 1.137 1.742 1.245.216.108.342.09.469-.054.126-.144.539-.628.683-.844.144-.216.287-.18.485-.108.198.072 1.258.593 1.474.701.216.108.359.162.413.252.054.09.054.521-.09 1.146z" />
                        </svg>
                        <span>Chat With Us</span>
                      </a>

                      <a
                        href="mailto:care@shrutimangesh.com"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:border-[#4A0E17] hover:text-[#4A0E17] transition text-[11.5px] font-medium tracking-wide"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                          <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                        </svg>
                        <span>care@shrutimangesh.com</span>
                      </a>
                    </div>

                    <p className="font-sans-clean text-[10.5px] text-[#333333] pt-1">
                      Monday to Saturday – 9:30 am to 6:00 pm IST
                    </p>
                  </div>
                </div>
              </div>

              {/* ACCORDION 3: DELIVERY & RETURNS */}
              <div className="border-t border-[#D5CEC5] py-4">
                <button
                  onClick={() => toggleSection('delivery')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base sm:text-lg font-medium tracking-[0.10em] uppercase text-[#333333] text-left cursor-pointer group"
                >
                  <span className="group-hover:text-[#4A0E17] transition-colors">DELIVERY & RETURNS</span>
                  <span className="w-7 h-7 flex items-center justify-center text-[#333333] group-hover:text-[#4A0E17] transition-transform duration-300 ease-out">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ease-out ${openSections.delivery ? 'rotate-45 text-[#4A0E17]' : 'rotate-0'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.delivery ? 'grid-rows-[1fr] opacity-100 pt-3 pb-2' : 'grid-rows-[0fr] opacity-0 pt-0 pb-0'
                  }`}
                >
                  <div className="overflow-hidden space-y-2 font-sans-clean text-[11.5px] text-[#333333] tracking-wide">
                    <p className="text-[#333333]">
                      {product.returnsPolicy || 'This item is not eligible for return or exchange.'} <span className="text-[#333333] underline cursor-pointer font-medium">More Info</span>
                    </p>
                    <a
                      href="#returns-policy"
                      className="inline-block font-semibold text-[#333333] underline hover:text-[#4A0E17] transition"
                    >
                      Return & Exchange Policy
                    </a>
                  </div>
                </div>
              </div>

              {/* ACCORDION 4: DISCLAIMER */}
              <div className="border-t border-b border-[#D5CEC5] py-4">
                <button
                  onClick={() => toggleSection('disclaimer')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base sm:text-lg font-medium tracking-[0.10em] uppercase text-[#333333] text-left cursor-pointer group"
                >
                  <span className="group-hover:text-[#4A0E17] transition-colors">DISCLAIMER</span>
                  <span className="w-7 h-7 flex items-center justify-center text-[#333333] group-hover:text-[#4A0E17] transition-transform duration-300 ease-out">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ease-out ${openSections.disclaimer ? 'rotate-45 text-[#4A0E17]' : 'rotate-0'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.disclaimer ? 'grid-rows-[1fr] opacity-100 pt-3 pb-2' : 'grid-rows-[0fr] opacity-0 pt-0 pb-0'
                  }`}
                >
                  <div className="overflow-hidden font-serif-story text-[13.5px] leading-relaxed text-[#333333]">
                    <p>
                      {product.disclaimer || 'The colour of the product may vary slightly from how it appears here. This may be due to different display settings on various devices and also because of any lighting filters or special effects used during the shoot.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* You May Also Like Section */}
        <div className="mt-20 pt-16 border-t border-[#EAE3DB]">
          <div className="text-center mb-10">
            <h2 className="font-heading text-xl sm:text-2xl tracking-[0.14em] text-[#333333] uppercase font-light">
              YOU MAY ALSO LIKE
            </h2>
            <p className="font-sans-clean text-[10px] text-[#333333] tracking-[0.14em] mt-1.5 font-light">
              Curated pairings from the Autumn/Winter collection
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {relatedProducts.map((rel) => (
              <a
                key={rel.id}
                href={`/products/${rel.id}`}
                className="group block text-center cursor-pointer"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-[#ECE8E1] mb-3">
                  <img
                    src={rel.imageFront}
                    alt={rel.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="font-serif-luxury text-[13px] tracking-[0.08em] text-[#333333] uppercase group-hover:text-[#4A0E17] transition-colors font-normal w-full h-[18px] overflow-hidden text-ellipsis whitespace-nowrap" title={rel.title}>
                  {rel.title}
                </h3>
                <p className="font-sans-clean text-xs text-[#333333] font-medium mt-1">
                  ₹{rel.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsSizeGuideOpen(false)} />
          <div className="relative bg-[#FAF8F5] max-w-2xl w-full p-8 rounded-xs shadow-2xl z-10 border border-[#EAE3DB]">
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-4 right-4 text-xl text-gray-400 hover:text-black"
            >
              ✕
            </button>
            <h3 className="font-heading text-xl tracking-[0.14em] text-[#4A0E17] uppercase mb-4 font-light">
              MEN'S COUTURE SIZE GUIDE
            </h3>
            <p className="font-sans-clean text-xs text-gray-500 mb-6">All measurements are in inches. Custom tailored fittings available.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full font-sans-clean text-xs text-left border border-gray-200">
                <thead className="bg-[#FAF2F3] text-[#4A0E17] font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Chest (in)</th>
                    <th className="p-2.5">Waist (in)</th>
                    <th className="p-2.5">Shoulder (in)</th>
                    <th className="p-2.5">Length (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr><td className="p-2.5 font-bold">38 (S)</td><td className="p-2.5">38-39</td><td className="p-2.5">32-33</td><td className="p-2.5">18.0</td><td className="p-2.5">43</td></tr>
                  <tr><td className="p-2.5 font-bold">40 (M)</td><td className="p-2.5">40-41</td><td className="p-2.5">34-35</td><td className="p-2.5">18.5</td><td className="p-2.5">44</td></tr>
                  <tr><td className="p-2.5 font-bold">42 (L)</td><td className="p-2.5">42-43</td><td className="p-2.5">36-37</td><td className="p-2.5">19.0</td><td className="p-2.5">44.5</td></tr>
                  <tr><td className="p-2.5 font-bold">44 (XL)</td><td className="p-2.5">44-45</td><td className="p-2.5">38-39</td><td className="p-2.5">19.5</td><td className="p-2.5">45</td></tr>
                  <tr><td className="p-2.5 font-bold">46 (XXL)</td><td className="p-2.5">46-47</td><td className="p-2.5">40-41</td><td className="p-2.5">20.0</td><td className="p-2.5">45.5</td></tr>
                  <tr><td className="p-2.5 font-bold">48 (3XL)</td><td className="p-2.5">48-49</td><td className="p-2.5">42-43</td><td className="p-2.5">20.5</td><td className="p-2.5">46</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A0E17] text-white px-6 py-3.5 rounded-xs shadow-2xl flex items-center gap-3 font-sans-clean text-xs tracking-wider animate-bounce border border-[#66141F]">
          <span>✨</span>
          <span>Added to shopping bag successfully!</span>
        </div>
      )}
    </div>
  );
};
