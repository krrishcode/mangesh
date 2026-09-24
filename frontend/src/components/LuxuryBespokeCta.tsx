export default function LuxuryBespokeCta() {
  return (
    <>
      <section className="py-24 bg-[#FCFAF7] text-[#333333] border-t border-b border-[#EAE3DB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <span className="font-sans-clean text-[10px] font-medium tracking-[0.25em] uppercase text-[#66141F] block mb-3">
            MANGESH MAHADEV BESPOKE GROOM ATELIER
          </span>
      
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[44px] tracking-[0.12em] font-light text-[#333333] max-w-2xl mx-auto leading-tight mb-5 uppercase">
            CRAFTING TIMELESS HEIRLOOMS FOR THE MODERN GENTLEMAN
          </h2>
      
          <p className="font-serif-luxury text-base sm:text-lg text-[#333333] max-w-xl mx-auto mb-10 font-light leading-relaxed">
            "Every creation is custom-woven, hand-embroidered in pure Zardozi, and precision-tailored to your sovereign silhouette."
          </p>
      
          {/* Minimalist Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a
              href="#bespoke-appointment"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-[#66141F] transition"
            >
              BOOK ATELIER APPOINTMENT
            </a>
            <a
              href="#fw26"
              className="w-full sm:w-auto px-8 py-3.5 border border-[#1A1A1A] text-[#333333] text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-[#1A1A1A] hover:text-white transition"
            >
              EXPLORE COLLECTION &rarr;
            </a>
          </div>
      
          {/* Minimal Micro-Perks */}
          <div className="mt-14 pt-10 border-t border-[#EAE3DB] grid grid-cols-1 sm:grid-cols-3 gap-6 text-[10px] text-[#333333] tracking-[0.14em] uppercase font-medium">
            <div>Complimentary Master Alterations</div>
            <div>Worldwide Express Doorstep Delivery</div>
            <div>1-on-1 Dedicated Groom Stylist</div>
          </div>
      
        </div>
      </section>
      
      
    </>
  );
}
