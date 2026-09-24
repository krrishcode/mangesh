export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'sherwanis',
    name: 'SHERWANIS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/sherwanis',
  },
  {
    id: 'bandhgalas',
    name: 'BANDHGALAS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/bandhgalas',
  },
  {
    id: 'kurtas',
    name: 'KURTAS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwa1347020/images/hires/FW26/F26MP4K_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/kurtas',
  },
  {
    id: 'nehru-jackets',
    name: 'BANDI',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwfab212d9/images/hires/FW26/F26MP2B_SAGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/nehru-jackets',
  },
  {
    id: 'tuxedos',
    name: 'TUXEDOS & SUITS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw83bb767f/images/hires/FW26/F26MP31J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/accessories',
  },
  {
    id: 'ceremonial-groom',
    name: 'SHIRTS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/sherwanis',
  },
  {
    id: 'safas-stoles',
    name: 'TROUSERS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweeadaa9a/images/hires/FW26/F26M7SR_PINK_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/trousers',
  },
  {
    id: 'silk-couture',
    name: 'HERITAGE SILKS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwba1c1f0d/images/hires/FW26/F26MP4SR_IVORY_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '/collections/kurtas',
  },
];
export default function CategoryGrid() {
  return (
    <>
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          
          {/* Clean Minimalist Header Matching Screenshot */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.14em] text-[#333333] font-light uppercase">
              LOVE ALL | FW'26
            </h2>
            <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] tracking-[0.06em] mt-3 font-light normal-case">
              A love that sustains is one that begins as a game of equals. Playful & honouring the other as they are.
            </p>
          </div>
      
          {/* 4-Column Clean Minimalist Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={cat.href}
                className="group block text-center cursor-pointer"
              >
                {/* Pure clean image container with no dark overlays */}
                <div className="relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-4">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
      
                {/* Clean minimal text BELOW image */}
                <h3 className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.20em] font-medium text-[#333333] uppercase group-hover:text-[#4A0E17] transition-colors">
                  {cat.name}
                </h3>
              </a>
            ))}
          </div>
      
        </div>
      </section>
    </>
  );
}
