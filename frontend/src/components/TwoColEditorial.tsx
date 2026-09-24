export default function TwoColEditorial() {
  return (
    <>
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-center">
            
            {/* Left Clean Portrait Visual */}
            <div className="relative aspect-[3/3.8] overflow-hidden bg-[#ECE8E1]">
              <img
                src="https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-AD-INDIA-Library/default/dw0d85648d/AD_Refresh_Aug_2026/desktop/578%C3%97663_1_SPOTLIGHT_SHOP_NOW_SECTION.jpg"
                alt="Love All, FW'26 Spotlight"
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
            </div>
      
            {/* Right Clean Minimal Narrative */}
            <div className="flex flex-col justify-center text-center md:text-left space-y-5 px-4 lg:px-8">
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[42px] tracking-[0.12em] text-[#333333] font-light uppercase leading-tight">
                Love All, FW'26
              </h2>
              
              <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] leading-relaxed font-light max-w-md">
                What does it mean to love someone who is fully themselves? To be loved the same way in return? Discover sovereign menswear crafted for lifetime celebrations.
              </p>
      
              <div>
                <a
                  href="#fw26"
                  className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.20em] text-[#333333] hover:text-[#4A0E17] transition border-b border-[#1A1A1A] hover:border-[#4A0E17] pb-1 uppercase mt-2"
                >
                  <span>DISCOVER</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>
      
          </div>
        </div>
      </section>
      
      
    </>
  );
}
