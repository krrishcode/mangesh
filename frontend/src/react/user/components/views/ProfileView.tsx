'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../stores/authStore';
import { fetchApi } from '../../../../lib/api';

export const ProfileView: React.FC = () => {
  const { user, setAuth, token } = useAuthStore();
  const [measurements, setMeasurements] = useState<any>(null);
  
  // Profile state
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // loading
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMeasurements, setSavingMeasurements] = useState(false);

  useEffect(() => {
    fetchApi<{ data: any }>('/users/me/measurements')
      .then(res => setMeasurements(res.data || {}))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const res = await fetchApi<{ data: any }>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), phone })
      });
      setAuth(res.data, token!);
      alert('Profile updated');
    } catch(err) {
      alert('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMeasurementsSave = async () => {
    setSavingMeasurements(true);
    try {
      const payload: any = { unit: measurements.unit || 'inches' };
      ['chest', 'waist', 'hip', 'shoulder', 'sleeveLength', 'inseam'].forEach(k => {
        if (measurements[k]) payload[k] = Number(measurements[k]);
      });
      await fetchApi('/users/me/measurements', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      alert('Measurements updated');
    } catch(err) {
      alert('Failed to save measurements');
    } finally {
      setSavingMeasurements(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm font-sans-clean">Loading profile...</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border border-[#EAE3DB] bg-white p-6 md:p-8">
        <h2 className="text-lg font-serif-luxury tracking-wider text-[#333333] uppercase mb-6">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans-clean">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">First Name</label>
            <input type="text" className="w-full border-b border-[#EAE3DB] bg-transparent py-2 text-sm font-light text-[#333333] focus:outline-none focus:border-[#4A0E17]" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Last Name</label>
            <input type="text" className="w-full border-b border-[#EAE3DB] bg-transparent py-2 text-sm font-light text-[#333333] focus:outline-none focus:border-[#4A0E17]" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Email</label>
            <input type="email" className="w-full border-b border-[#EAE3DB] bg-transparent py-2 text-sm font-light text-[#333333] mt-1 opacity-70" value={user?.email || ''} disabled />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">Phone</label>
            <input type="tel" className="w-full border-b border-[#EAE3DB] bg-transparent py-2 text-sm font-light text-[#333333] focus:outline-none focus:border-[#4A0E17]" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>
        <button onClick={handleProfileSave} disabled={savingProfile} className="mt-8 bg-[#333333] text-white px-8 py-3 text-[11px] font-sans-clean uppercase tracking-widest hover:bg-[#4A0E17] transition-colors">
          {savingProfile ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="border border-[#EAE3DB] bg-white p-6 md:p-8">
        <h2 className="text-lg font-serif-luxury tracking-wider text-[#333333] uppercase mb-6">Haute Couture Measurements</h2>
        <p className="text-xs font-sans-clean font-light text-gray-500 mb-6">Used for your bespoke fitting sessions. Measurements are in inches.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 font-sans-clean">
          {[
            { key: 'chest', label: 'Chest / Bust' },
            { key: 'waist', label: 'Waist' },
            { key: 'hip', label: 'Hip' },
            { key: 'shoulder', label: 'Shoulder' },
            { key: 'sleeveLength', label: 'Sleeve Length' },
            { key: 'inseam', label: 'Inseam' },
          ].map((m) => (
            <div key={m.key}>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">{m.label}</label>
              <input type="text" className="w-full border-b border-[#EAE3DB] bg-transparent py-2 text-sm font-light text-[#333333] focus:outline-none focus:border-[#4A0E17]" 
                     value={measurements?.[m.key] || ''} 
                     onChange={e => setMeasurements({...measurements, [m.key]: e.target.value})} />
            </div>
          ))}
        </div>
        <button onClick={handleMeasurementsSave} disabled={savingMeasurements} className="mt-8 border border-[#EAE3DB] text-[#333333] px-8 py-3 text-[11px] font-sans-clean uppercase tracking-widest hover:bg-[#FAF8F5] transition-colors">
           {savingMeasurements ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </div>
  );
};
