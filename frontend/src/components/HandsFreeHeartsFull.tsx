import Link from 'next/link';

const LOOKS = [
  {
    name: 'Kurtas',
    image: '/products/blue-deer-kurta/blue-deer-kurta-01.webp',
    href: '/collections/kurtas',
  },
  {
    name: 'Shackets',
    image: '/products/black-ivory-shacket/black-ivory-shacket-01.webp',
    href: '/collections/shackets',
  },
];

export default function HandsFreeHeartsFull() {
  return (
    <section className="home-section" aria-labelledby="everyday-title">
      <div className="home-container">
        <div className="home-section-header">
          <h2 id="everyday-title" className="home-heading">
            Kurtas & shackets
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {LOOKS.map((look) => (
            <Link
              key={look.name}
              href={look.href}
              className="block hover:text-primary-foreground"
            >
              <div className="mb-3 aspect-[4/5] overflow-hidden bg-[#ECE8E1]">
                <img
                  src={look.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <h3 className="home-label">
                Shop {look.name.toLowerCase()}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
