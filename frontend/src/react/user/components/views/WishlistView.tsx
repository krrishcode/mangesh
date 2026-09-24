'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../../lib/api';

export const WishlistView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ success: boolean; data: any[] }>('/wishlist')
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id: number) => {
    try {
      await fetchApi(`/wishlist/${id}`, { method: 'DELETE' });
      setItems(items.filter(i => i.product_id !== id));
    } catch(err) {
      console.error(err);
    }
  }

  if (loading) return <div className="p-8 text-center text-sm font-sans-clean">Loading wishlist...</div>;

  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-serif-luxury tracking-wider text-[#333333] uppercase mb-6">Your Wishlist</h2>
      {items.length === 0 && <div className="text-gray-500 text-sm">Your wishlist is empty.</div>}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            <div className="aspect-[3/4] overflow-hidden bg-gray-100 flex items-center justify-center">
              {/* Fallback image */}
              <img src="https://images.unsplash.com/photo-1594938291221-94f18cbb5660?q=80&w=800&auto=format&fit=crop" alt={item.title} className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
              <button onClick={() => handleRemove(item.product_id)} className="absolute top-3 right-3 text-white mix-blend-difference hover:scale-110 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
            </div>
            <div className="mt-4 text-center">
              <h3 className="font-sans-clean text-xs font-light tracking-wide text-[#333333] truncate uppercase">{item.title}</h3>
              <p className="mt-1 font-sans-clean text-sm font-medium">₹{(item.sale_price || item.price || 0).toLocaleString()}</p>
            </div>
            <button className="w-full mt-4 border border-[#EAE3DB] py-2 text-[10px] uppercase tracking-widest font-sans-clean hover:bg-[#333333] hover:text-white transition-colors duration-300">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
