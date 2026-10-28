const WHATSAPP_NUMBER = '919999313366';
const whatsappHref = (message: string) =>
  `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
const SERVICES = [
  {
    title: 'Wedding styling',
    body: 'Choose outfits, fabrics and fittings for your wedding events.',
    message: 'Hello, I would like to enquire about wedding styling.',
  },
  {
    title: 'Wardrobe planning',
    body: 'Plan outfits for upcoming occasions with our styling team.',
    message: 'Hello, I would like to enquire about wardrobe planning.',
  },
];

export default function InTheSpotlightGrid() {
  return (
    <section
      id="get-styled"
      className="home-section"
      aria-labelledby="styling-title"
    >
      <span id="spotlight" />
      <div className="home-container">
        <div className="grid items-center gap-8 bg-white p-5 sm:p-8 md:grid-cols-2 lg:gap-16 lg:p-12">
          <div className="aspect-[4/5] overflow-hidden bg-[#ECE8E1]">
            <img
              src="/images/get-styled.png"
              alt="Embroidered coat worn over a black kurta"
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div>
            <h2 id="styling-title" className="home-heading">
              Personal styling
            </h2>
            <p className="home-copy mt-5 max-w-md">
              Speak with our team about your occasion, fit and fabric
              preferences.
            </p>
            <div className="mt-8 divide-y divide-[#D8D0C6] border-y border-[#D8D0C6]">
              {SERVICES.map((service) => (
                <div key={service.title} className="py-6">
                  <h3 className="text-base font-normal">{service.title}</h3>
                  <p className="home-copy mt-2 max-w-md">{service.body}</p>
                  <a
                    href={whatsappHref(service.message)}
                    target="_blank"
                    rel="noreferrer"
                    className="home-action mt-4"
                  >
                    Enquire on WhatsApp
                    <span className="sr-only">
                      {' '}
                      about {service.title.toLowerCase()}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
