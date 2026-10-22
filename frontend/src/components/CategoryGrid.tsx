import Link from 'next/link';
import type { CatalogCategory } from '../lib/catalog';
import type { MensProduct } from '../data/mensCollection';
export default function CategoryGrid({ categories, products }: { categories: CatalogCategory[]; products: MensProduct[] }) {
  const visible = categories.map(category => ({ ...category, image: products.find(product => product.categorySlug === category.slug && product.imageFront)?.imageFront })).filter(category => category.image);
  if (!visible.length) return null;
  return <section className="home-section" aria-labelledby="categories-title"><div className="home-container">
    <div className="home-section-header"><h2 id="categories-title" className="home-heading">Shop by category</h2><Link href="/shop" className="home-action">View all clothing</Link></div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 md:grid-cols-4">{visible.map(category => <Link id={category.slug} key={category.id} href={`/collections/${category.slug}`} className="block scroll-mt-28 hover:text-primary-foreground"><div className="mb-3 aspect-[2/3] overflow-hidden bg-[#ECE8E1]"><img src={category.image} alt="" loading="lazy" className="h-full w-full object-cover object-top" /></div><h3 className="home-label">{category.name}</h3></Link>)}</div>
  </div></section>;
}
