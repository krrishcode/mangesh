export default function EditorialSpotlight() {
  return (
    <>
      <section id="groom-edit" className="py-24 bg-[#FCFAF7] text-[#333333]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Editorial Visual - Clean with no dark box */}
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#ECE8E1]">
                <img
                  src="https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwba1c1f0d/images/hires/FW26/F26MP4SR_IVORY_1.jpg?sw=850&sh=1275&sm=fit&strip=false"
                  alt="The Royal Groom Sanctuary"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
      
            {/* Right Minimal Narrative */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-left">
              <span className="font-sans-clean text-[10px] font-medium tracking-[0.25em] uppercase text-[#66141F]">
                THE WEDDING ATELIER
              </span>
      
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl tracking-[0.10em] text-[#333333] font-light uppercase leading-tight">
                THE ROYAL GROOM SANCTUARY
              </h2>
      
              <p className="font-serif-luxury text-base sm:text-lg text-gray-700 leading-relaxed font-light">
                "Resonance in pure ivory raw silk, meticulously embroidered with antique Zardozi wires and tonal Kasab threadwork."
              </p>
      
              <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] leading-relaxed font-light">
                From sovereign palace pheras to destination sunset celebrations, the House of Mangesh Mahadev tailors complete ceremonial ensembles—including custom-draped safas, stoles, and handcrafted jewelry.
              </p>
      
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="#bespoke-appointment"
                  className="px-8 py-3.5 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-[#66141F] transition inline-block"
                >
                  BOOK GROOM CONSULTATION
                </a>
                <a
                  href="#sherwanis"
                  className="px-8 py-3.5 border border-[#1A1A1A] text-[#333333] text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-[#1A1A1A] hover:text-white transition inline-block"
                >
                  VIEW SHERWANIS &rarr;
                </a>
              </div>
            </div>
      
          </div>
        </div>
      </section>
      
      
    </>
  );
}
