import Link from 'next/link';

const EXPLORE_ITEMS = [
  {
    title: 'Celebrity looks',
    image:
      '/images/celebrities/abel-biju.jpg',
    href: '/celebrities',
  },
  {
    title: 'Fabrics & styling',
    image:
      '/products/maroon-bandhgala-set/maroon-bandhgala-02.webp',
    href: '#get-styled',
  },
];

export default function MoreToExplore() {
  return (
    <section
      id="about-house"
      className="home-section"
      aria-labelledby="explore-title"
    >
      <div className="home-container">
        <div className="home-section-header">
          <h2 id="explore-title" className="home-heading">
            Explore
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {EXPLORE_ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block hover:text-primary-foreground"
            >
              <div className="mb-3 aspect-[4/5] overflow-hidden bg-[#ECE8E1]">
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <h3 className="home-label">{item.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
