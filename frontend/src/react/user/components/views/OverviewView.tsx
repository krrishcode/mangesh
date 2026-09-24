'use client';

import React from 'react';
import { useAuthStore } from '../../../../stores/authStore';

export const OverviewView: React.FC = () => {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border border-[#EAE3DB] p-8 bg-white">
        <h2 className="text-2xl font-serif-luxury tracking-wider text-[#333333] uppercase">Welcome Back, {user?.name?.split(' ')[0] || 'Guest'}</h2>
        <p className="mt-2 font-sans-clean text-sm font-light tracking-wide text-gray-500">Your bespoke fashion journey continues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-[#EAE3DB] p-6 bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-sans-clean text-xs font-medium tracking-widest text-gray-400 uppercase mb-4">Recent Order</h3>
            <p className="text-sm font-sans-clean font-light text-[#333333]">View your latest purchases</p>
          </div>
          <a href="/account/orders" className="mt-6 text-left text-[11px] font-sans-clean tracking-widest font-medium uppercase text-[#4A0E17] hover:underline">
            View All Orders
          </a>
        </div>

        <div className="border border-[#EAE3DB] p-6 bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-sans-clean text-xs font-medium tracking-widest text-gray-400 uppercase mb-4">Upcoming Appointment</h3>
            <p className="text-sm font-sans-clean font-light text-[#333333]">Manage your bespoke sessions</p>
          </div>
          <a href="/account/appointments" className="mt-6 text-left text-[11px] font-sans-clean tracking-widest font-medium uppercase text-[#4A0E17] hover:underline">
            Manage Appointments
          </a>
        </div>
      </div>
    </div>
  );
};
