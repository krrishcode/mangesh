export default function MensWearBanner() {
  return (
    <>
      <section className="w-full relative overflow-hidden bg-[#1A1A1A]">
        <div className="relative w-full h-[60vh] min-h-[420px] max-h-[640px]">
          <img
            src="https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-AD-INDIA-Library/default/dwf395e137/AD_Refresh_Aug_2026/desktop/2035X1290_1_BANNER.jpg"
            alt="Love All Denim Collection Campaign"
            loading="lazy"
            className="w-full h-full object-cover object-top filter brightness-95"
          />
          <div className="absolute inset-0 bg-black/20" />
          
          <a
            href="#fw26"
            className="absolute inset-0 flex items-center justify-center text-center p-6 group cursor-pointer"
            aria-label="Love All Denim Collection"
          >
            <div className="max-w-xl text-white">
              <span className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-[#E6C69C] block mb-3 font-medium">
                AUTUMN / WINTER 2026
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl tracking-[0.10em] uppercase font-light text-white mb-5">
                LOVE ALL | DENIM
              </h2>
              <span className="inline-block px-8 py-3.5 bg-white text-[#333333] hover:bg-[#4A0E17] hover:text-white transition text-[11px] font-medium tracking-[0.22em] uppercase shadow-lg">
                EXPLORE DENIM &rarr;
              </span>
            </div>
          </a>
        </div>
      </section>
      
      
    </>
  );
}
