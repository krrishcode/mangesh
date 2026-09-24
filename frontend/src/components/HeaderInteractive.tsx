'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '../stores';

export const HeaderInteractive: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPrice = (amount: number) =>
    `₹${Math.round(amount).toLocaleString('en-IN')}`;

  const navLinks = [
    { name: 'ALL CLOTHING', href: '/shop' },
    { name: 'SHERWANIS', href: '/collections/sherwanis' },
    { name: 'BANDHGALAS', href: '/collections/bandhgalas' },
    { name: 'KURTA SETS', href: '/collections/kurtas' },
    { name: 'NEHRU JACKETS', href: '/collections/nehru-jackets' },
    { name: 'TROUSERS', href: '/collections/trousers' },
    { name: 'GROOM EDIT', href: '/#groom-edit' },
    { name: 'CELEBS', href: '/#celebs' },
    { name: 'BESPOKE TAILORING', href: '/#bespoke-appointment' },
  ];

  return (
    <>
      {/* Clean & Minimalist Luxury Top Bar in Oxblood */}
      <div className="bg-[#4A0E17] text-[#F5EBE6] text-[10.5px] tracking-[0.22em] py-2 border-b border-[#360910] uppercase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Left: Atelier Appointment shortcut */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#bespoke-appointment"
              className="text-[#E6C69C] hover:text-white transition font-medium tracking-widest"
            >
              Book Atelier Consultation
            </a>
          </div>

          {/* Center: Clean & Understated Message */}
          <div className="w-full md:w-auto text-center font-medium tracking-[0.22em] text-[#FDFBFA]">
            COMPLIMENTARY WORLDWIDE EXPRESS SHIPPING
          </div>

          {/* Right: Minimal Currency Switcher */}
          <div className="hidden md:flex items-center gap-2 text-[#E6C69C]">
            <span className="text-[10px] text-[#D8B48B] font-light">INR (₹)</span>
          </div>
        </div>
      </div>

      {/* Main Luxury Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF8F5]/95 backdrop-blur-md shadow-xs border-b border-[#EAE3DB] py-3'
            : 'bg-[#FAF8F5] border-b border-[#EAE3DB] py-4 lg:py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Mobile Trigger & Search */}
            <div className="flex items-center gap-4 lg:w-1/3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-gray-800 hover:text-[#4A0E17] focus:outline-none"
                aria-label="Open Navigation Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-600 hover:text-[#4A0E17] transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden md:inline">Search</span>
              </button>
            </div>

            {/* Center Monogram / Brand Logo (Guaranteed Single Line) */}
            <div className="flex-1 text-center px-2">
              <a href="/" className="inline-block group">
                <span className="font-heading text-base sm:text-2xl lg:text-[28px] xl:text-[32px] font-light tracking-[0.14em] sm:tracking-[0.20em] text-[#333333] group-hover:text-[#4A0E17] transition block uppercase whitespace-nowrap">
                  MANGESH MAHADEV
                </span>
              </a>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-5 lg:w-1/3 text-gray-700">
              <a
                href="/account"
                className="hidden md:flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-medium hover:text-[#4A0E17] transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden xl:inline">Account</span>
              </a>

              <a
                href="/cart"
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] font-medium text-[#333333] hover:text-[#4A0E17] transition relative p-1"
                aria-label="Shopping Bag"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="hidden sm:inline">Bag</span>
                {totalItems() > 0 && (
                  <span className="w-4 h-4 bg-[#4A0E17] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {totalItems()}
                  </span>
                )}
              </a>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center justify-center gap-8 pt-3 border-t border-gray-100 text-[11px] tracking-[0.20em] font-medium text-[#2E2E2E]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-[#4A0E17] transition relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1.5px] after:bg-[#4A0E17] hover:after:w-full after:transition-all font-medium"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FAF5F6]">
                <div>
                  <h2 className="font-heading text-sm tracking-[0.14em] text-[#4A0E17] font-light">SHOPPING BAG</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{totalItems()} item(s) selected</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-400 hover:text-black p-2"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Items */}
              <div className="flex-1 overflow-y-auto p-6 divide-y divide-gray-100">
                {items.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-[#FAF5F6] border border-[#E8D6D9] flex items-center justify-center mx-auto mb-4 text-[#4A0E17]">
                      👜
                    </div>
                    <h3 className="font-heading text-xs tracking-[0.14em] text-gray-800 font-light">YOUR BAG IS EMPTY</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                      Explore our bespoke sherwanis, bandhgalas, and heritage kurtas.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 px-6 py-2.5 bg-[#4A0E17] text-white text-xs uppercase tracking-widest hover:bg-[#66141F] transition"
                    >
                      Explore Collection
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.product_id} className="py-4 flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-20 h-28 object-cover rounded bg-gray-100 border border-gray-200"
                        />
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-[#4A0E17] font-bold mt-1">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 rounded">
                            <button
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product_id)}
                            className="text-[11px] text-gray-400 hover:text-[#4A0E17] underline font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {items.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-[#FAF5F6]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Subtotal</span>
                    <span className="text-sm font-bold text-[#4A0E17]">{formatPrice(totalPrice())}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Shipping</span>
                    <span className="text-xs font-medium text-emerald-700 font-bold">COMPLIMENTARY</span>
                  </div>
                  <button
                    onClick={() => {
                      alert('Proceeding to Bespoke Concierge & Secure Checkout');
                    }}
                    className="w-full py-3.5 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.20em] uppercase hover:bg-[#66141F] transition shadow-md"
                  >
                    PROCEED TO CHECKOUT &rarr;
                  </button>
                  <p className="text-[10px] text-center text-gray-500 mt-3">
                    Bespoke customization & fittings available post-order
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white/98 flex flex-col">
          <div className="max-w-4xl w-full mx-auto p-6 flex justify-between items-center">
            <span className="font-heading text-sm tracking-[0.14em] text-[#4A0E17] font-light">SEARCH ATELIER</span>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-2xl text-gray-400 hover:text-black p-2"
            >
              ✕
            </button>
          </div>
          <div className="max-w-3xl w-full mx-auto px-6 py-12">
            <div className="relative border-b-2 border-[#4A0E17] pb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sherwanis, Bandhgalas, Silks, Bundis..."
                className="w-full text-xl focus:outline-none bg-transparent placeholder-gray-400 text-[#4A0E17] font-light"
                autoFocus
              />
              <button className="absolute right-0 top-2 text-[11px] uppercase tracking-[0.16em] text-[#4A0E17] font-medium">
                Search
              </button>
            </div>

            <div className="mt-8">
              <span className="text-[10px] text-gray-400 uppercase tracking-[0.14em] block mb-3 font-light">
                Trending Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {['Zardozi Sherwani', 'Oxblood Bandhgala', 'Mulberry Silk Kurta', 'Sage Nehru Jacket', 'Groom Wedding Edit'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="px-3.5 py-1.5 bg-[#FAF5F6] border border-[#E8D6D9] hover:bg-[#4A0E17] hover:text-white rounded-full text-[11px] text-[#4A0E17] transition font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Off-Canvas Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                <span className="font-heading text-sm tracking-[0.14em] text-[#4A0E17] font-light">MANGESH MAHADEV</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-black">
                  ✕
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-4 text-xs font-medium tracking-widest uppercase">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 border-b border-gray-50 hover:text-[#4A0E17] font-medium"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 text-xs">
              <a href="#bespoke-appointment" className="block w-full py-3 bg-[#4A0E17] text-white text-center tracking-[0.14em] uppercase mb-3 font-medium hover:bg-[#66141F] transition">
                Book Consultation
              </a>
              <p className="text-[10px] text-gray-500 text-center">
                Dedicated Stylist: +91 (0) 22 6127 0000
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
