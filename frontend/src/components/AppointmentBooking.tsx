'use client';

import React, { useState } from 'react';

export const AppointmentBooking: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Mumbai Atelier',
    occasion: 'Royal Wedding (Groom)',
    date: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="bespoke-appointment" className="py-24 bg-[#FAF8F5] text-[#333333]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="font-sans-clean text-[10px] font-medium tracking-[0.25em] uppercase text-[#66141F] block mb-2">
            VIP BESPOKE CONCIERGE
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.12em] text-[#333333] font-light uppercase">
            BOOK YOUR ATELIER STYLING
          </h2>
          <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] tracking-[0.06em] mt-3 font-light normal-case">
            Personalized master measurement sessions and custom embroidery curation with our head designers.
          </p>
        </div>

        {/* Minimal Form in Light Beige */}
        <div className="bg-[#FCFAF7] p-8 sm:p-12 border border-[#EAE3DB] rounded-xs shadow-xs">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-[#FAF5F6] text-[#4A0E17] border border-[#E8D6D9] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                ✓
              </div>
              <h4 className="font-serif-luxury text-lg text-[#4A0E17] tracking-[0.12em] mb-2 font-light uppercase">
                APPOINTMENT INITIATED
              </h4>
              <p className="font-sans-clean text-[11px] text-gray-600 max-w-sm mx-auto leading-relaxed font-light">
                Thank you, <strong className="text-gray-900">{formData.name}</strong>. Our Senior Groomswear Concierge will connect with you within 4 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-2.5 bg-[#4A0E17] text-white text-[11px] uppercase tracking-[0.16em] hover:bg-[#66141F] transition font-medium"
              >
                Book Another Session
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans-clean text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johnathan Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xs text-xs focus:border-[#4A0E17] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-sans-clean text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@luxury.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xs text-xs focus:border-[#4A0E17] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans-clean text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xs text-xs focus:border-[#4A0E17] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-sans-clean text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 mb-2">
                    Preferred Atelier
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xs text-xs focus:border-[#4A0E17] focus:outline-none cursor-pointer"
                  >
                    <option>Mumbai Atelier (Kala Ghoda)</option>
                    <option>New Delhi Atelier (Mehrauli)</option>
                    <option>London Mayfair Showroom</option>
                    <option>New York City Studio</option>
                    <option>Global Virtual HD Video Consultation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans-clean text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 mb-2">
                    Ceremonial Occasion
                  </label>
                  <select
                    value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xs text-xs focus:border-[#4A0E17] focus:outline-none cursor-pointer"
                  >
                    <option>Royal Wedding (Groom Ensemble)</option>
                    <option>Sangeet & Cocktail Celebration</option>
                    <option>Groomsmen & Family Wardrobe</option>
                    <option>Bespoke Black Tie Gala</option>
                  </select>
                </div>
                <div>
                  <label className="block font-sans-clean text-[10px] font-medium uppercase tracking-[0.14em] text-gray-600 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xs text-xs focus:border-[#4A0E17] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-[#66141F] transition mt-4"
              >
                REQUEST APPOINTMENT &rarr;
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
};
