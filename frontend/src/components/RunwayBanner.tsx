const RUNWAY_IMAGE =
  'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-AD-INDIA-Library/default/dw72baae88/images/Home%20page/Apr2024/NewHomepage/19/desktop/RUNWAY_MORE%20TO%20EXPLORE_IND%20&%20USA.jpg';

export default function RunwayBanner() {
  return (
    <>
      <section id="lookbook" className="py-20 bg-[#425B9A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-center">

            {/* Left: Runway Visual */}
            <div className="relative aspect-[3/3.8] overflow-hidden bg-black/20 rounded-xs shadow-xl">
              <img
                src={RUNWAY_IMAGE}
                alt="Love All FW'26 runway looks"
                loading="lazy"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out hover:scale-105"
              />
            </div>

            {/* Right: Minimal Narrative */}
            <div className="flex flex-col justify-center text-center md:text-left space-y-5 px-4 lg:px-8">
              <span className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-[#E6C69C] font-semibold">
                Haute Couture Runway
              </span>

              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[42px] tracking-[0.12em] text-white font-light uppercase leading-tight">
                Runway FW&rsquo;26
              </h2>

              <p className="font-sans-clean text-[11px] sm:text-xs text-[#F5EBE6] leading-relaxed font-light max-w-md">
                Every look from the Love All runway, photographed as it walked — front,
                detail and in motion. See the collection first, then commission it
                made-to-measure at the atelier.
              </p>

              <div>
                <a
                  href="/shop"
                  className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.20em] text-[#E6C69C] hover:text-white transition border-b border-[#E6C69C] hover:border-white pb-1 uppercase mt-2"
                >
                  <span>View the Collection</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
