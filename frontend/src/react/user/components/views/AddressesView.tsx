'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../../lib/api';

export const AddressesView: React.FC = () => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ success: boolean; data: any[] }>('/users/me/addresses')
      .then(res => setAddresses(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-sm font-sans-clean">Loading addresses...</div>;

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-serif-luxury tracking-wider text-[#333333] uppercase">Address Book</h2>
        <button className="text-[11px] font-sans-clean font-medium tracking-widest uppercase text-[#4A0E17] hover:underline">
          Add New
        </button>
      </div>
      
      {addresses.length === 0 && <div className="text-gray-500 text-sm">No addresses found.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map(addr => (
          <div key={addr.id} className="border border-[#EAE3DB] bg-white p-6 relative">
            <span className="absolute top-6 right-6 text-[9px] bg-gray-100 text-gray-600 px-2 py-1 uppercase tracking-widest">
              {addr.isDefault ? `Default ${addr.label}` : addr.label}
            </span>
            <h3 className="font-sans-clean text-sm font-medium text-[#333333] mb-3">{addr.fullName || 'No Name'}</h3>
            <div className="font-sans-clean text-xs font-light text-gray-500 leading-relaxed space-y-1">
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{addr.city}, {addr.state} {addr.postalCode}</p>
              <p>{addr.country}</p>
              <p className="mt-3 text-[#333333]">T: {addr.phone}</p>
            </div>
            <div className="mt-6 flex gap-4 text-[10px] font-sans-clean uppercase tracking-widest text-gray-400">
              <button className="hover:text-[#4A0E17]">Edit</button>
              <button className="hover:text-[#4A0E17]">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
