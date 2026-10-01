'use client';

import Link from 'next/link';

import React from 'react';
import { useCartStore } from '../stores';

export const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  const subtotal = totalPrice();
  const shipping = 0;
  const total = subtotal + shipping;

  const formatINR = (amount: number) =>
    `₹${Math.round(amount).toLocaleString('en-IN')}`;

  return (
    <main className="bg-[#FAF8F5] min-h-screen pt-4 pb-16 text-[#333333]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Breadcrumb */}
        <nav className="font-sans-clean text-[10.5px] text-[#333333] mb-4 flex flex-wrap items-center gap-2 tracking-[0.14em] uppercase">
          <Link href="/" className="hover:text-[#4A0E17] transition font-medium">Home</Link>
          <span>/</span>
          <span className="text-[#333333] font-semibold">Shopping Bag</span>
        </nav>

        <h1 className="font-heading text-2xl sm:text-3xl tracking-[0.14em] text-[#333333] uppercase font-light mb-8">
          SHOPPING BAG
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-[#FCFAF7] border border-[#EAE3DB] rounded-xs">
            <h2 className="font-serif-luxury text-2xl tracking-[0.12em] text-[#333333] uppercase mb-2 font-light">
              Your Bag is Empty
            </h2>
            <p className="font-sans-clean text-[11px] text-[#333333] tracking-[0.06em] font-light normal-case mb-6">
              Discover our handcrafted couture and begin your bespoke journey.
            </p>
            <Link
              href="/shop"
              className="inline-block px-10 py-3.5 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.20em] uppercase hover:bg-[#66141F] transition"
            >
              EXPLORE COLLECTION
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex gap-4 sm:gap-6 bg-[#FCFAF7] border border-[#EAE3DB] rounded-xs p-4 sm:p-6"
                >
                  <Link
                    href={`/products/${item.product_id}`}
                    className="w-24 sm:w-32 shrink-0 aspect-[3/4] overflow-hidden bg-[#ECE8E1] rounded-xs block hover:opacity-80 transition"
                  >
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover object-top"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="font-serif-luxury text-sm sm:text-base tracking-[0.10em] text-[#333333] uppercase font-normal leading-snug hover:text-[#4A0E17] transition-colors"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-[11px] font-medium text-gray-500 hover:text-[#4A0E17] transition tracking-wider uppercase shrink-0"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div className="flex items-center border border-[#D5CEC5] rounded-xs">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center text-gray-700 hover:text-[#4A0E17] transition"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-[#333333]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center text-gray-700 hover:text-[#4A0E17] transition"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-serif-luxury text-lg text-[#333333] font-normal tracking-wider">
                          {formatINR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="font-sans-clean text-[11px] text-[#4A0E17] font-medium underline tracking-[0.14em] uppercase hover:text-black transition"
              >
                Clear All
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#FCFAF7] border border-[#EAE3DB] rounded-xs p-6 sm:p-8 sticky top-24">
                <h2 className="font-serif-luxury text-xl tracking-[0.12em] text-[#333333] uppercase font-light mb-6">
                  ORDER SUMMARY
                </h2>

                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between text-[#333333]">
                    <span className="font-sans-clean text-[11px] tracking-[0.14em] uppercase font-medium">Subtotal</span>
                    <span className="font-serif-luxury tracking-wider">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#333333]">
                    <span className="font-sans-clean text-[11px] tracking-[0.14em] uppercase font-medium">Shipping</span>
                    <span className="font-serif-luxury tracking-wider text-[#4A0E17] font-medium">COMPLIMENTARY</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EAE3DB] pt-3 text-[#333333]">
                    <span className="font-sans-clean text-[11px] tracking-[0.14em] uppercase font-medium">Total</span>
                    <span className="font-serif-luxury text-xl tracking-wider">{formatINR(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => alert('Proceeding to Bespoke Concierge & Secure Checkout')}
                  className="w-full mt-6 py-4 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.20em] uppercase hover:bg-[#66141F] transition shadow-md"
                >
                  PROCEED TO CHECKOUT →
                </button>

                <p className="font-sans-clean text-[10px] text-gray-500 text-center mt-3 font-light tracking-wide">
                  Bespoke customization & fittings available post-order
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
