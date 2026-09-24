import React, { useState } from 'react';

interface LookbookItem {
  id: number;
  title: string;
  season: string;
  image: string;
  tag: string;
}

const LOOKBOOK_ITEMS: LookbookItem[] = [
  {
    id: 1,
    title: 'Imperial Beige Zardozi Sherwani',
    season: 'Autumn/Winter Runway',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    tag: 'LOOK 01',
  },
  {
    id: 2,
    title: 'Ivory Pichhwai Silk Bandhgala',
    season: 'Imperial Court Suite',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    tag: 'LOOK 02',
  },
  {
    id: 3,
    title: 'Antique Gold Dabka Sherwani',
    season: 'Royal Groom Sanctuary',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    tag: 'LOOK 03',
  },
  {
    id: 4,
    title: 'Rose Gold Zardozi & Pichhwai Stole',
    season: 'Destination Wedding',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweeadaa9a/images/hires/FW26/F26M7SR_PINK_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    tag: 'LOOK 04',
  },
];

export const LookbookGallery: React.FC = () => {
  const [activeZoom, setActiveZoom] = useState<LookbookItem | null>(null);

  return (
    <section id="lookbook" className="py-20 bg-[#FAF8F5]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Clean Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.14em] text-[#333333] font-light uppercase">
            AUTUMN / WINTER '26 LOOKBOOK
          </h2>
          <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] tracking-[0.06em] mt-3 font-light normal-case">
            A visual anthology celebrating regal silhouettes, imperial embroidery, and modern masculine poise.
          </p>
        </div>

        {/* 4-Column Clean Grid with text below image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {LOOKBOOK_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group block text-center cursor-pointer"
              onClick={() => setActiveZoom(item)}
            >
              <div className="relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>

              {/* Minimal Text Below Image */}
              <h3 className="font-serif-luxury text-[13px] tracking-[0.08em] text-[#333333] uppercase group-hover:text-[#4A0E17] transition-colors font-normal w-full h-[18px] overflow-hidden text-ellipsis whitespace-nowrap" title={item.title}>
                {item.title}
              </h3>
              <p className="font-sans-clean text-[10px] sm:text-[11px] text-[#333333] tracking-[0.14em] mt-1 uppercase font-medium">
                {item.tag} • {item.season}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {activeZoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <button
            onClick={() => setActiveZoom(null)}
            className="absolute top-6 right-6 text-2xl text-white hover:text-[#E6C69C] p-2 z-10"
          >
            ✕
          </button>
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row items-center gap-8 bg-[#FCFAF7] p-6 rounded-xs">
            <div className="h-[65vh] w-full md:w-1/2 overflow-hidden rounded-xs bg-gray-100">
              <img
                src={activeZoom.image}
                alt={activeZoom.title}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="md:w-1/2 space-y-4 text-left p-4">
              <span className="font-sans-clean text-[10px] tracking-[0.20em] uppercase text-[#66141F] font-medium">
                {activeZoom.tag} • {activeZoom.season}
              </span>
              <h2 className="font-serif-luxury text-xl sm:text-2xl tracking-[0.10em] text-gray-900 font-light uppercase">
                {activeZoom.title}
              </h2>
              <div className="w-12 h-0.5 bg-[#4A0E17]" />
              <p className="font-sans-clean text-sm text-gray-600 leading-relaxed font-light">
                "An archival masterpiece rendered in pure raw silk, tailored with sovereign grace."
              </p>
              <div className="pt-4">
                <a
                  href="#bespoke-appointment"
                  onClick={() => setActiveZoom(null)}
                  className="px-6 py-3 bg-[#4A0E17] text-white text-[11px] font-medium tracking-[0.20em] uppercase hover:bg-[#66141F] transition inline-block"
                >
                  INQUIRE ABOUT THIS LOOK
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
