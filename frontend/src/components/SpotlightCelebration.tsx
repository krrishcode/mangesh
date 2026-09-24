interface SpotlightItem {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  href: string;
}

const SPOTLIGHT_ITEMS: SpotlightItem[] = [
  {
    id: 'cocktail-edit',
    name: 'THE COCKTAIL EDIT',
    subtitle: 'Silk Tuxedos & Evening Blazers',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw83bb767f/images/hires/FW26/F26MP31J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '#blazers',
  },
  {
    id: 'sangeet-celebration',
    name: 'SANGEET & MEHENDI',
    subtitle: 'Chanderi Bundis & Embroidered Kurtas',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwfab212d9/images/hires/FW26/F26MP2B_SAGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '#nehru-jackets',
  },
  {
    id: 'royal-reception',
    name: 'IMPERIAL RECEPTION',
    subtitle: 'Zardozi Silk Bandhgalas',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    href: '#bandhgalas',
  },
];

const PRESS_LOGOS = [
  { name: 'VOGUE MAN', quote: '“Redefining royal menswear with sovereign elegance and artisanal soul.”' },
  { name: 'GQ INDIA', quote: '“The pinnacle of modern Indian couture for the discerning groom.”' },
  { name: 'HARPER’S BAZAAR', quote: '“Breathtaking heritage craftsmanship meets contemporary precision.”' },
  { name: 'FORBES LUXURY', quote: '“The undisputed standard in bespoke Indian wedding couture.”' },
];

export default function SpotlightCelebration() {
  return (
    <>
      <section id="spotlight" className="py-20 bg-[#FAF8F5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.14em] text-[#333333] font-light uppercase">
              IN THE SPOTLIGHT
            </h2>
            <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] tracking-[0.06em] mt-3 font-light normal-case">
              From dusk till dawn: explore signature ensembles curated for every ceremonial chapter.
            </p>
          </div>
      
          {/* 3-Column Minimal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {SPOTLIGHT_ITEMS.map((item) => (
              <a key={item.id} href={item.href} className="group block text-center cursor-pointer">
                <div className="relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
      
                <h3 className="font-serif-luxury text-sm sm:text-base tracking-[0.12em] font-normal text-[#333333] uppercase group-hover:text-[#4A0E17] transition-colors">
                  {item.name}
                </h3>
                <p className="font-sans-clean text-[10px] sm:text-[11px] text-[#333333] tracking-[0.06em] mt-1 font-light normal-case">
                  {item.subtitle}
                </p>
              </a>
            ))}
          </div>
      
          {/* In The Press */}
          <div className="mt-20 pt-16 border-t border-[#EAE3DB]">
            <div className="text-center mb-10">
              <h3 className="font-serif-luxury text-xl tracking-[0.14em] text-gray-900 uppercase font-light">
                IN THE PRESS
              </h3>
            </div>
      
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {PRESS_LOGOS.map((press) => (
                <div key={press.name} className="p-6 bg-white/70 border border-gray-200/60 rounded-xs flex flex-col justify-between">
                  <span className="font-sans-clean text-[10px] font-medium tracking-[0.16em] text-[#4A0E17] block mb-2 uppercase">
                    {press.name}
                  </span>
                  <p className="font-sans-clean text-[11px] text-gray-600 leading-relaxed font-light">
                    {press.quote}
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-100 text-[9px] font-medium uppercase tracking-[0.16em] text-[#66141F]">
                    Editorial Review
                  </div>
                </div>
              ))}
            </div>
          </div>
      
        </div>
      </section>
    </>
  );
}
