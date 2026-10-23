import { CelebsShowcase } from '@/components/CelebsShowcase';
import CategoryGrid from '@/components/CategoryGrid';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import { HeroSlider } from '@/components/HeroSlider';
import HandsFreeHeartsFull from '@/components/HandsFreeHeartsFull';
import InTheSpotlightGrid from '@/components/InTheSpotlightGrid';
import MensWearBanner from '@/components/MensWearBanner';
import MoreToExplore from '@/components/MoreToExplore';
import RunwayBanner from '@/components/RunwayBanner';
import { ProductCarousel } from '@/components/ProductCarousel';
import ScheduleAppointmentBanner from '@/components/ScheduleAppointmentBanner';
import TwoColEditorial from '@/components/TwoColEditorial';
import Footer from '@/components/Footer';
import '@/styles/home.css';
import { getCatalogProducts, getCatalogCategories } from '@/server/services/catalog';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Menswear | Mangesh Mahadev',
  description:
    'Explore sherwanis, bandhgalas, kurtas and contemporary menswear from Mangesh Mahadev.',
};

export default async function Page() {
  const [products, categories] = await Promise.all([getCatalogProducts(), getCatalogCategories()]);
  return (
    <>
      <HeaderInteractive />

      <main id="main" className="home-page">
        <h1 className="sr-only">Mangesh Mahadev menswear</h1>
        <HeroSlider />
        <CategoryGrid products={products} categories={categories} />
        <TwoColEditorial />
        <RunwayBanner />
        <MensWearBanner />
        <ProductCarousel products={products.slice(0, 8)} />
        <HandsFreeHeartsFull />
        <CelebsShowcase />
        <InTheSpotlightGrid />
        <MoreToExplore />
        <div id="bespoke-appointment" className="home-section">
          <ScheduleAppointmentBanner />
        </div>
      </main>

      <Footer compact />
    </>
  );
}
