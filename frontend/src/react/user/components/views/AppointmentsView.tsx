'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../../lib/api';

export const AppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ success: boolean; data: any[] }>('/appointments')
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-sm font-sans-clean">Loading appointments...</div>;

  return (
    <div className="border border-[#EAE3DB] bg-white animate-fadeIn">
      <div className="p-6 border-b border-[#EAE3DB] flex justify-between items-center">
        <h2 className="text-lg font-serif-luxury tracking-wider text-[#333333] uppercase">Bespoke Appointments</h2>
        <button className="border border-[#EAE3DB] px-4 py-2 text-[11px] font-sans-clean font-medium tracking-widest uppercase text-[#333333] hover:bg-[#FAF8F5] transition-colors">
          Book New
        </button>
      </div>
      <div className="divide-y divide-[#EAE3DB]">
        {appointments.length === 0 && <div className="p-6 text-center text-gray-500">No appointments found.</div>}
        {appointments.map((apt) => (
          <div key={apt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex gap-3 items-center mb-1">
                <h3 className="font-sans-clean font-medium text-sm text-[#333333]">{apt.location}</h3>
                <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                  apt.status === 'upcoming' ? 'bg-[#4A0E17]/10 text-[#4A0E17]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {apt.status}
                </span>
              </div>
              <p className="text-xs font-sans-clean font-light text-gray-500">{apt.occasion}</p>
              <p className="text-[13px] font-sans-clean font-light text-[#333333] mt-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {new Date(apt.scheduled_at).toLocaleString()}
              </p>
            </div>
            <div className="flex sm:flex-col gap-3">
              {apt.status === 'upcoming' && (
                <button className="text-[11px] font-sans-clean font-medium tracking-widest uppercase text-gray-500 hover:text-[#333333]">
                  Reschedule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
