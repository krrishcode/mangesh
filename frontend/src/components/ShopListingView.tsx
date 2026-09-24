'use client';

import React, { useState, useMemo } from 'react';
import { MENS_PRODUCTS, type MensProduct } from '../data/mensCollection';
import { useCartStore } from '../stores';

interface ShopListingViewProps {
  initialCategory?: string;
}

export const ShopListingView: React.FC<ShopListingViewProps> = ({ initialCategory }) => {
  // State Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [onlyReadyToShip, setOnlyReadyToShip] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('relevant');
  
  // UI Layout States
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(4);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<MensProduct | null>(null);
  const [quickSize, setQuickSize] = useState<string>('38');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accordion open states in filter drawer
  const [filterAccordions, setFilterAccordions] = useState<{ [key: string]: boolean }>({
    category: true,
    price: true,
    color: true,
    size: true,
    craft: true,
    readyToShip: true,
  });

  const { addItem } = useCartStore();

  const categories = ['All', 'Sherwanis', 'Bandhgalas', 'Kurtas', 'Nehru Jackets', 'Trousers', 'Shackets', 'Accessories'];

  const colorOptions = [
    { name: 'Imperial Oxblood', hex: '#4A0E17' },
    { name: 'Off White', hex: '#EDE7DF' },
    { name: 'Beige', hex: '#D6C7B2' },
    { name: 'Gold', hex: '#D4AF37' },
    { name: 'Sage', hex: '#9EAD9F' },
    { name: 'Wine', hex: '#66141F' },
    { name: 'Emerald Green', hex: '#1B4D3E' },
    { name: 'Pink', hex: '#E2B2B8' },
    { name: 'Mist Blue', hex: '#8DA3B3' },
  ];

  const sizeOptions = ['38', '40', '42', '44', '46', '48'];

  const craftOptions = [
    'Zardozi Gold-Thread',
    'Hand-painted Pichhwai',
    'Benarasi Woven',
    'Aari & Dori',
    'Chikankari',
    'Tone-on-Tone',
  ];

  const toggleFilterAccordion = (key: string) => {
    setFilterAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleColor = (c: string) => {
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]));
  };

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]));
  };

  const toggleCraft = (cr: string) => {
    setSelectedCrafts((prev) => (prev.includes(cr) ? prev.filter((item) => item !== cr) : [...prev, cr]));
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedCrafts([]);
    setPriceRange([0, 500000]);
    setOnlyReadyToShip(false);
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuickAdd = (product: MensProduct, size: string) => {
    addItem({
      product_id: product.id,
      quantity: 1,
      price: product.price,
      title: `${product.title} (Size ${size})`,
      image_url: product.imageFront,
    });
    setToastMessage(`Added ${product.title} to bag`);
    setTimeout(() => setToastMessage(null), 3000);
    setQuickViewProduct(null);
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return MENS_PRODUCTS.filter((product) => {
      // Category
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }
      // Color
      if (selectedColors.length > 0) {
        const matchesColor = selectedColors.some((c) =>
          product.color.toLowerCase().includes(c.toLowerCase())
        );
        if (!matchesColor) return false;
      }
      // Size
      if (selectedSizes.length > 0) {
        const matchesSize = selectedSizes.some((s) => product.sizes.includes(s));
        if (!matchesSize) return false;
      }
      // Craft
      if (selectedCrafts.length > 0) {
        const matchesCraft = selectedCrafts.some((cr) =>
          product.craft.toLowerCase().includes(cr.toLowerCase())
        );
        if (!matchesCraft) return false;
      }
      // Price (already in INR)
      const inrPrice = product.price;
      if (inrPrice < priceRange[0] || inrPrice > priceRange[1]) {
        return false;
      }
      // Ready to ship
      if (onlyReadyToShip && !product.readyToShip) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const priceA = a.price;
      const priceB = b.price;
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'newest') return parseInt(b.id) - parseInt(a.id);
      return 0; // Relevant
    });
  }, [selectedCategory, selectedColors, selectedSizes, selectedCrafts, priceRange, onlyReadyToShip, sortBy]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    selectedCrafts.length +
    (onlyReadyToShip ? 1 : 0) +
    (priceRange[1] < 500000 || priceRange[0] > 0 ? 1 : 0);

  return (
    <div className="bg-[#FAF8F5] text-[#333333] min-h-screen pt-4 pb-20">
      
      {/* Minimalist Top Breadcrumb & Product Count Row */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-2 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Breadcrumb */}
          <nav className="font-sans-clean text-[11px] text-[#333333] flex items-center gap-1.5 tracking-[0.14em] uppercase">
            <a href="/" className="hover:text-[#4A0E17] transition">Home</a>
            <span>/</span>
            <a href="/shop" className="hover:text-[#4A0E17] transition">MEN</a>
            <span>/</span>
            <span className="text-[#333333] font-semibold">
              {selectedCategory === 'All' ? 'View All Clothing' : selectedCategory}
            </span>
          </nav>

          {/* Product Count Inline */}
          <span className="font-sans-clean text-[11px] text-[#333333] tracking-[0.14em] uppercase">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
          </span>

        </div>
      </div>

      {/* Sticky Filter & Sorting Bar */}
      <div className="sticky top-20 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3DB] py-3.5 transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
          
          {/* Left: Filter Toggle Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="inline-flex items-center gap-2.5 px-4 py-2 border border-[#1A1A1A] bg-[#FCFAF7] hover:bg-[#1A1A1A] hover:text-white transition text-xs font-sans-clean font-semibold tracking-[0.2em] uppercase rounded-xs cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#4A0E17] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Ready to Ship switch */}
            <button
              onClick={() => setOnlyReadyToShip(!onlyReadyToShip)}
              className={`hidden md:inline-flex items-center gap-2 px-3 py-2 text-xs font-sans-clean tracking-wider border rounded-xs transition ${
                onlyReadyToShip
                  ? 'border-[#4A0E17] bg-[#FAF2F3] text-[#4A0E17] font-semibold'
                  : 'border-[#D5CEC5] text-[#333333] hover:border-black'
              }`}
            >
              <span>⚡</span>
              <span>Ready To Ship</span>
            </button>

            {/* Active filter count clear */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-sans-clean text-[#4A0E17] underline tracking-wider uppercase font-semibold hidden sm:inline"
              >
                Clear All ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Right: Grid Switcher & Sorting */}
          <div className="flex items-center gap-4">
            
            {/* Multi-column Grid Switcher (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 border border-[#D5CEC5] bg-[#FCFAF7] p-1 rounded-xs">
              <button
                onClick={() => setGridColumns(2)}
                className={`p-1.5 rounded-2xs transition ${gridColumns === 2 ? 'bg-[#4A0E17] text-white' : 'text-gray-500 hover:text-black'}`}
                title="2 Columns"
                aria-label="2 Columns View"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="8" height="18" rx="1" />
                  <rect x="13" y="3" width="8" height="18" rx="1" />
                </svg>
              </button>

              <button
                onClick={() => setGridColumns(3)}
                className={`p-1.5 rounded-2xs transition ${gridColumns === 3 ? 'bg-[#4A0E17] text-white' : 'text-gray-500 hover:text-black'}`}
                title="3 Columns"
                aria-label="3 Columns View"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="3" width="5.5" height="18" rx="1" />
                  <rect x="9.25" y="3" width="5.5" height="18" rx="1" />
                  <rect x="16.5" y="3" width="5.5" height="18" rx="1" />
                </svg>
              </button>

              <button
                onClick={() => setGridColumns(4)}
                className={`p-1.5 rounded-2xs transition ${gridColumns === 4 ? 'bg-[#4A0E17] text-white' : 'text-gray-500 hover:text-black'}`}
                title="4 Columns"
                aria-label="4 Columns View"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="3" width="4" height="18" rx="1" />
                  <rect x="7.3" y="3" width="4" height="18" rx="1" />
                  <rect x="12.6" y="3" width="4" height="18" rx="1" />
                  <rect x="18" y="3" width="4" height="18" rx="1" />
                </svg>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-sans-clean text-[11px] text-gray-500 uppercase tracking-widest hidden sm:inline">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#FCFAF7] border border-[#D5CEC5] text-xs font-sans-clean tracking-wider py-2 px-3 focus:outline-none focus:border-[#4A0E17] rounded-xs cursor-pointer"
              >
                <option value="relevant">Most Relevant</option>
                <option value="price-low">Price: Low To High</option>
                <option value="price-high">Price: High To Low</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Main Product Grid */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        
        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs font-sans-clean">
            <span className="text-gray-500 uppercase tracking-wider text-[11px]">Active Filters:</span>
            
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF2F3] text-[#4A0E17] border border-[#E8D6D9] rounded-xs">
                <span>Category: {selectedCategory}</span>
                <button onClick={() => setSelectedCategory('All')} className="font-bold cursor-pointer">✕</button>
              </span>
            )}

            {selectedColors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF2F3] text-[#4A0E17] border border-[#E8D6D9] rounded-xs">
                <span>Color: {c}</span>
                <button onClick={() => toggleColor(c)} className="font-bold cursor-pointer">✕</button>
              </span>
            ))}

            {selectedSizes.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF2F3] text-[#4A0E17] border border-[#E8D6D9] rounded-xs">
                <span>Size: {s}</span>
                <button onClick={() => toggleSize(s)} className="font-bold cursor-pointer">✕</button>
              </span>
            ))}

            {selectedCrafts.map((cr) => (
              <span key={cr} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF2F3] text-[#4A0E17] border border-[#E8D6D9] rounded-xs">
                <span>Craft: {cr}</span>
                <button onClick={() => toggleCraft(cr)} className="font-bold cursor-pointer">✕</button>
              </span>
            ))}

            {onlyReadyToShip && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF2F3] text-[#4A0E17] border border-[#E8D6D9] rounded-xs">
                <span>⚡ Ready To Ship</span>
                <button onClick={() => setOnlyReadyToShip(false)} className="font-bold cursor-pointer">✕</button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="text-[#4A0E17] underline ml-2 font-semibold hover:text-black"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Empty Search Result */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-[#FCFAF7] border border-[#EAE3DB] rounded-xs p-8">
            <h3 className="font-serif-luxury text-2xl tracking-[0.10em] text-[#333333] uppercase mb-2 font-light">
              No Pieces Found
            </h3>
            <p className="font-sans-clean text-xs text-gray-500 max-w-md mx-auto mb-6">
              We couldn't find any menswear matching your refined filter selections. Please adjust your criteria or reset filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-[#4A0E17] text-white font-sans-clean text-[11px] font-medium tracking-[0.20em] uppercase hover:bg-[#66141F] transition shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Grid Container */
          <div
            className={`grid gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8 ${
              gridColumns === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : gridColumns === 3
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {filteredProducts.map((product) => {
              const isWishlisted = wishlistIds.includes(product.id);
              const inrPrice = product.price * 86.5;

              return (
                <div key={product.id} className="group flex flex-col relative text-center">
                  
                  {/* Image Container with Dual Hover Crossfade */}
                  <div className="relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-3.5">
                    
                    <a href={`/products/${product.id}`} className="block w-full h-full">
                      {/* Front Image */}
                      <img
                        src={product.imageFront}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-top absolute inset-0 transition-opacity duration-700 ease-in-out group-hover:opacity-0"
                      />
                      {/* Detail Image on Hover */}
                      <img
                        src={product.imageDetail}
                        alt={`${product.title} Detail`}
                        loading="lazy"
                        className="w-full h-full object-cover object-top absolute inset-0 transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100 group-hover:scale-105"
                      />
                    </a>

                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-[#FAF8F5]/95 backdrop-blur-xs text-[#4A0E17] font-sans-clean text-[9px] font-bold tracking-[0.25em] uppercase px-2.5 py-1 border border-[#E8D6D9] pointer-events-none">
                        {product.badge}
                      </span>
                    )}

                    {/* Wishlist Heart Button */}
                    <button
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-[#4A0E17] transition shadow-xs cursor-pointer z-10"
                      aria-label="Save to Wishlist"
                    >
                      <svg
                        className={`w-4 h-4 ${isWishlisted ? 'fill-[#4A0E17] text-[#4A0E17]' : 'fill-none'}`}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>

                    {/* Quick Add Slide-up Drawer on Desktop Hover */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden sm:flex flex-col gap-2 z-10 border-t border-gray-100">
                      <span className="font-sans-clean text-[9.5px] uppercase tracking-wider text-gray-600">Select Size:</span>
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {product.sizes.slice(0, 5).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleQuickAdd(product, s)}
                            className="px-2 py-1 text-[10px] font-sans-clean font-semibold border border-gray-300 hover:border-[#4A0E17] hover:bg-[#4A0E17] hover:text-white transition"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Brand Monogram */}
                  <span className="font-heading text-[10px] text-[#333333] tracking-[0.20em] uppercase block mb-1 font-light">
                    MANGESH MAHADEV
                  </span>

                  {/* Product Title */}
                  <a
                    href={`/products/${product.id}`}
                    className="font-serif-luxury text-[13px] font-normal tracking-[0.08em] text-[#333333] hover:text-[#4A0E17] transition-colors uppercase block w-full h-[18px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={product.title}
                  >
                    {product.title}
                  </a>

                  {/* Price */}
                  <div className="mt-1 flex items-baseline justify-center gap-2">
                    <span className="font-serif-luxury text-sm sm:text-base font-semibold text-[#333333]">
                      ₹{inrPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  {/* Ready to ship marker */}
                  {product.readyToShip && (
                    <span className="font-sans-clean text-[9.5px] text-[#4A0E17] font-semibold tracking-widest uppercase mt-1">
                      Ready To Ship
                    </span>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* FILTER SLIDE-OVER DRAWER MATCHING ANITA DONGRE EXACT SPECIFICATIONS */}
      {/* ========================================================================= */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between z-10 overflow-hidden border-l border-[#EAE3DB]">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#EAE3DB] flex items-center justify-between bg-[#FCFAF7]">
              <div>
                  <h2 className="font-serif-luxury text-2xl tracking-[0.12em] uppercase text-[#333333] font-light">
                  FILTERS
                </h2>
                <span className="font-sans-clean text-[11px] text-gray-500 tracking-wider">
                  {filteredProducts.length} Items Found
                </span>
              </div>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body - Scrollable Filter Accordions */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#222222]">
              
              {/* Accordion 1: Category */}
              <div className="border-b border-[#EAE3DB] pb-5">
                <button
                  onClick={() => toggleFilterAccordion('category')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base font-medium tracking-[0.10em] uppercase text-[#333333] mb-3 text-left"
                >
                  <span>Category</span>
                  <span>{filterAccordions.category ? '—' : '+'}</span>
                </button>

                {filterAccordions.category && (
                  <div className="space-y-2 font-sans-clean text-xs">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center justify-between cursor-pointer group py-1">
                        <span className={`group-hover:text-[#4A0E17] ${selectedCategory === cat ? 'font-semibold text-[#4A0E17]' : 'text-gray-700'}`}>
                          {cat === 'All' ? 'View All Menswear' : cat}
                        </span>
                        <input
                          type="radio"
                          name="categoryFilter"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                          className="accent-[#4A0E17]"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 2: Price Range */}
              <div className="border-b border-[#EAE3DB] pb-5">
                <button
                  onClick={() => toggleFilterAccordion('price')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base font-medium tracking-[0.10em] uppercase text-[#333333] mb-3 text-left"
                >
                  <span>Price Range</span>
                  <span>{filterAccordions.price ? '—' : '+'}</span>
                </button>

                {filterAccordions.price && (
                  <div className="space-y-3 font-sans-clean">
                    <div className="flex justify-between text-xs text-gray-600 font-medium">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full accent-[#4A0E17] cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => setPriceRange([0, 50000])}
                        className="px-2.5 py-1 text-[11px] border border-gray-300 bg-white hover:border-[#4A0E17]"
                      >
                        Under ₹50k
                      </button>
                      <button
                        onClick={() => setPriceRange([50000, 150000])}
                        className="px-2.5 py-1 text-[11px] border border-gray-300 bg-white hover:border-[#4A0E17]"
                      >
                        ₹50k – ₹1.5L
                      </button>
                      <button
                        onClick={() => setPriceRange([150000, 500000])}
                        className="px-2.5 py-1 text-[11px] border border-gray-300 bg-white hover:border-[#4A0E17]"
                      >
                        Above ₹1.5L
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Color Swatches */}
              <div className="border-b border-[#EAE3DB] pb-5">
                <button
                  onClick={() => toggleFilterAccordion('color')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base font-medium tracking-[0.10em] uppercase text-[#333333] mb-3 text-left"
                >
                  <span>Color</span>
                  <span>{filterAccordions.color ? '—' : '+'}</span>
                </button>

                {filterAccordions.color && (
                  <div className="grid grid-cols-2 gap-2.5 font-sans-clean text-xs">
                    {colorOptions.map((c) => {
                      const isSelected = selectedColors.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          onClick={() => toggleColor(c.name)}
                          className={`flex items-center gap-2.5 p-2 rounded-xs border transition ${
                            isSelected
                              ? 'border-[#4A0E17] bg-[#FAF2F3] text-[#4A0E17] font-semibold'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-black'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 4: Size */}
              <div className="border-b border-[#EAE3DB] pb-5">
                <button
                  onClick={() => toggleFilterAccordion('size')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base font-medium tracking-[0.10em] uppercase text-[#333333] mb-3 text-left"
                >
                  <span>Size</span>
                  <span>{filterAccordions.size ? '—' : '+'}</span>
                </button>

                {filterAccordions.size && (
                  <div className="flex flex-wrap gap-2 font-sans-clean">
                    {sizeOptions.map((s) => {
                      const isSelected = selectedSizes.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleSize(s)}
                          className={`w-11 h-10 flex items-center justify-center text-xs border transition ${
                            isSelected
                              ? 'border-[#4A0E17] bg-[#4A0E17] text-white font-semibold shadow-xs'
                              : 'border-gray-300 bg-white text-gray-800 hover:border-black'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 5: Craft Heritage */}
              <div className="border-b border-[#EAE3DB] pb-5">
                <button
                  onClick={() => toggleFilterAccordion('craft')}
                  className="w-full flex justify-between items-center font-serif-luxury text-base font-medium tracking-[0.10em] uppercase text-[#333333] mb-3 text-left"
                >
                  <span>Craft Heritage</span>
                  <span>{filterAccordions.craft ? '—' : '+'}</span>
                </button>

                {filterAccordions.craft && (
                  <div className="space-y-2 font-sans-clean text-xs">
                    {craftOptions.map((cr) => {
                      const isSelected = selectedCrafts.includes(cr);
                      return (
                        <label key={cr} className="flex items-center justify-between cursor-pointer group py-1">
                          <span className={`group-hover:text-[#4A0E17] ${isSelected ? 'font-semibold text-[#4A0E17]' : 'text-gray-700'}`}>
                            {cr}
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCraft(cr)}
                            className="accent-[#4A0E17] w-4 h-4"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 6: Availability */}
              <div className="pb-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="font-serif-luxury text-base tracking-[0.10em] uppercase text-[#333333] group-hover:text-[#4A0E17] font-medium">
                    Ready To Ship Only
                  </span>
                  <input
                    type="checkbox"
                    checked={onlyReadyToShip}
                    onChange={(e) => setOnlyReadyToShip(e.target.checked)}
                    className="accent-[#4A0E17] w-4 h-4"
                  />
                </label>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-[#EAE3DB] bg-[#FCFAF7] space-y-2.5 font-sans-clean">
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-4 bg-[#4A0E17] text-white hover:bg-[#66141F] transition text-[11px] font-medium tracking-[0.20em] uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>VIEW {filteredProducts.length} PIECES</span>
                <span>&rarr;</span>
              </button>

              <button
                onClick={clearAllFilters}
                className="w-full py-3 border border-gray-300 text-gray-700 hover:border-black hover:text-black transition text-[11px] font-medium tracking-[0.20em] uppercase"
              >
                CLEAR ALL
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A0E17] text-white px-6 py-3.5 rounded-xs shadow-2xl flex items-center gap-3 font-sans-clean text-xs tracking-wider animate-bounce border border-[#66141F]">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
