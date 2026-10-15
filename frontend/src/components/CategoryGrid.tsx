import Link from 'next/link';

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  href: string;
}
const CATEGORIES: CategoryItem[] = [
  {
    id: 'sherwanis',
    name: 'Sherwanis',
    image: '/images/categories/sherwanis.png',
    href: '/collections/sherwanis',
  },
  {
    id: 'bandhgalas',
    name: 'Bandhgalas',
    image: '/images/categories/bandhgalas.png',
    href: '/collections/bandhgalas',
  },
  {
    id: 'kurtas',
    name: 'Kurtas',
    image: '/images/categories/kurtas.png',
    href: '/collections/kurtas',
  },
  {
    id: 'nehru-jackets',
    name: 'Nehru jackets',
    image: '/images/categories/bandi.png',
    href: '/collections/nehru-jackets',
  },
  {
    id: 'tuxedos',
    name: 'Tuxedos & suits',
    image: '/images/categories/tuxedos.png',
    href: '/collections/tuxedos',
  },
  {
    id: 'shackets',
    name: 'Shackets',
    image: '/products/black-ivory-shacket/black-ivory-shacket-01.webp',
    href: '/collections/shackets',
  },
  {
    id: 'trousers',
    name: 'Trousers',
    image: '/images/categories/trousers.png',
    href: '/collections/trousers',
  },
  {
    id: 'occasion-wear',
    name: 'Occasion wear',
    image: '/images/categories/heritage-silks.png',
    href: '/shop',
  },
];

export default function CategoryGrid() {
  return (
    <section className="home-section" aria-labelledby="categories-title">
      <div className="home-container">
        <div className="home-section-header">
          <h2 id="categories-title" className="home-heading">
            Shop by category
          </h2>
          <Link href="/shop" className="home-action">
            View all clothing
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 md:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              id={category.id}
              key={category.id}
              href={category.href}
              className="block scroll-mt-28 hover:text-primary-foreground"
            >
              <div className="mb-3 aspect-[2/3] overflow-hidden bg-[#ECE8E1]">
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <h3 className="home-label">{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
