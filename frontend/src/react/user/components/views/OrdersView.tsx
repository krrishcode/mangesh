'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../../lib/api';

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ success: boolean; data: any[] }>('/orders')
      .then((res) => {
        setOrders(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-sm font-sans-clean">Loading orders...</div>;

  return (
    <div className="border border-[#EAE3DB] bg-white animate-fadeIn">
      <div className="p-6 border-b border-[#EAE3DB]">
        <h2 className="text-lg font-serif-luxury tracking-wider text-[#333333] uppercase">Order History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans-clean text-sm font-light">
          <thead className="bg-[#FAF8F5] border-b border-[#EAE3DB] text-[11px] text-gray-500 uppercase tracking-[0.14em]">
            <tr>
              <th className="px-6 py-4 font-normal">Order</th>
              <th className="px-6 py-4 font-normal">Date</th>
              <th className="px-6 py-4 font-normal">Total</th>
              <th className="px-6 py-4 font-normal">Status</th>
              <th className="px-6 py-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE3DB]">
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No orders found.</td></tr>
            )}
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5">
                  <span className="font-medium text-[#333333]">{ord.order_number}</span>
                  <div className="text-xs text-gray-400 mt-1">{ord.items_count} item(s)</div>
                </td>
                <td className="px-6 py-5 text-gray-600">{new Date(ord.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-5 text-[#333333]">₹{ord.total_amount.toLocaleString()}</td>
                <td className="px-6 py-5">
                  <span className={`inline-block px-2.5 py-1 text-[10px] tracking-widest uppercase ${
                    ord.status === 'delivered' ? 'bg-[#EAE3DB]/40 text-gray-600' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {ord.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-[11px] font-medium tracking-widest uppercase text-[#4A0E17] hover:underline">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
