const WHATSAPP_NUMBER = '919999313366';

function whatsappHref(message: string) {
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}

interface Service {
  id: string;
  index: string;
  title: string;
  body: string;
  href: string;
}

const SERVICES: Service[] = [
  {
    id: 'wedding-styling',
    index: '01',
    title: 'Wedding Styling',
    body: 'From the pheras to the reception, a dedicated stylist curates and fits every ensemble — sherwani, bandhgala, safa and the details in between.',
    href: whatsappHref('Hi! I want to book Wedding Styling with Mangesh Mahadev Menswear.'),
  },
  {
    id: 'wardrobe-planning',
    index: '02',
    title: "Men's Wardrobe Planning",
    body: 'One sitting to plan a season of dressing — the occasions, the colour story, and the pieces worth commissioning, fitted to your calendar.',
    href: whatsappHref("Hi! I want to inquire about Men's Wardrobe Planning with Mangesh Mahadev Menswear."),
  },
];

const ATELIERS = ['Mumbai', 'New Delhi', 'London', 'New York'];

const STYLIST_IMAGE =
  'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false';

export default function InTheSpotlightGrid() {
  return (
    <>
      <section id="spotlight" className="w-full bg-[#425B9A] py-16 sm:py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-stretch">

            {/* Left: Male Model Visual (links to WhatsApp) */}
            <a
              href={whatsappHref('Hi! I would like to be styled by the Mangesh Mahadev atelier.')}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat with the Mangesh Mahadev styling team on WhatsApp"
              className="group relative block min-h-[440px] lg:min-h-[560px] overflow-hidden"
            >
              <img
                src={STYLIST_IMAGE}
                alt="Groom in a hand-embroidered sherwani from the Mangesh Mahadev atelier"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </a>

            {/* Right: Editorial Services */}
            <div className="flex flex-col justify-center">
              <p className="font-sans-clean text-[10px] tracking-[0.24em] uppercase text-[#E6C69C] mb-5">
                Private Client Services
              </p>

              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[42px] tracking-[0.12em] uppercase font-light text-white leading-tight">
                Get Styled by Mangesh
              </h2>

              <p className="font-sans-clean text-[11px] sm:text-xs font-light tracking-[0.04em] leading-relaxed text-[#F5EBE6] mt-5 max-w-md">
                Tell us the occasion on WhatsApp and a stylist from the atelier responds
                personally — with looks, fabrics and fitting dates.
              </p>

              {/* Services List */}
              <div className="mt-10 border-t border-b border-white/15 divide-y divide-white/15">
                {SERVICES.map((service) => (
                  <a
                    key={service.id}
                    href={service.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start py-7"
                  >
                    <p className="sm:col-span-2 font-serif-luxury text-[13px] tracking-[0.20em] text-[#E6C69C]">
                      {service.index}
                    </p>

                    <div className="sm:col-span-10">
                      <h3 className="font-sans-clean text-xs sm:text-[13px] tracking-[0.14em] uppercase font-medium text-white">
                        {service.title}
                      </h3>

                      <p className="font-sans-clean text-[11px] font-light tracking-[0.04em] leading-relaxed text-[#F5EBE6] mt-2 max-w-md">
                        {service.body}
                      </p>

                      <span className="inline-flex w-fit items-center gap-2.5 text-[11px] font-medium tracking-[0.20em] uppercase text-[#E6C69C] group-hover:text-white transition-colors border-b border-[#E6C69C] group-hover:border-white pb-1 mt-4">
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.073-1.045-.062-.317-.104-.707-.234-1.218-.456-2.152-.937-3.551-3.125-3.659-3.268-.107-.144-.868-1.157-.868-2.207 0-1.05.549-1.567.744-1.782.195-.215.426-.269.569-.269.143 0 .287.002.411.009.13.007.304-.049.475.362.179.43.612 1.493.666 1.603.054.11.09.239.018.383-.072.144-.108.233-.216.359-.108.126-.227.281-.324.377-.108.107-.221.224-.095.44.126.216.56 1.023 1.202 1.696.827.868 1.526 1.137 1.742 1.245.216.108.342.09.469-.054.126-.144.539-.628.683-.844.144-.216.287-.18.485-.108.198.072 1.258.593 1.474.701.216.108.359.162.413.252.054.09.054.521-.09 1.146z" />
                        </svg>
                        <span>Chat on WhatsApp</span>
                        <span aria-hidden="true">&rarr;</span>
                      </span>
                    </div>
                  </a>
                ))}
              </div>

              <p className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-[#E6C69C] mt-8">
                Complimentary consultations — {ATELIERS.join('  ·  ')}
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
