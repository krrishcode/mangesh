interface ExploreItem {
  id: string;
  title: string;
  image: string;
  href: string;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'in-the-press',
    title: 'IN THE PRESS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-AD-INDIA-Library/default/dwc103515f/images/Home%20page/Apr2024/NewHomepage/19/desktop/IN%20THE%20PRESS_MORE%20TO%20EXPLORE.jpg',
    href: '#spotlight',
  },
  {
    id: 'sustaining-crafts',
    title: 'SUSTAINING CRAFTS',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-AD-INDIA-Library/default/dwb3102bbb/images/sustainability/Sustaining%20Crafts.jpg',
    href: '#about-house',
  },
];

export default function MoreToExplore() {
  return (
    <>
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.14em] text-[#333333] font-light uppercase">
              MORE TO EXPLORE
            </h2>
          </div>
      
          {/* 2-Column Clean Grid with Text Below Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {EXPLORE_ITEMS.map((item) => (
              <a key={item.id} href={item.href} className="group block text-center cursor-pointer">
                <div className="relative aspect-[3/4.6] overflow-hidden bg-[#ECE8E1] mb-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
      
                <h3 className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.20em] font-medium text-[#333333] uppercase group-hover:text-[#4A0E17] transition-colors">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
      
        </div>
      </section>
    </>
  );
}
