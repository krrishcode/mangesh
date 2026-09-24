interface Look {
  id: string;
  name: string;
  image: string;
}

const LOOKS: Look[] = [
  {
    id: 'shirts',
    name: 'SHIRTS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
  },
  {
    id: 'shackets',
    name: 'SHACKETS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
  },
];

export default function HandsFreeHeartsFull() {
  return (
    <>
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">

          {/* 2-Column Clean Grid with Text Below Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10">
            {LOOKS.map((look) => (
              <div key={look.id} className="text-center">
                <div className="relative aspect-[4/4.8] overflow-hidden bg-[#ECE8E1] mb-4">
                  <img
                    src={look.image}
                    alt={look.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <h3 className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.20em] font-medium text-[#333333] uppercase">
                  {look.name}
                </h3>
              </div>
            ))}
          </div>
      
          {/* Centered Minimalist CTA */}
          <div className="text-center">
            <a
              href="#sherwanis"
              className="inline-block px-10 py-3.5 border border-[#1A1A1A] text-[#333333] hover:bg-[#4A0E17] hover:border-[#4A0E17] hover:text-white transition-all text-[11px] font-medium tracking-[0.20em] uppercase"
            >
              DISCOVER NOW
            </a>
          </div>
      
        </div>
      </section>
    </>
  );
}
