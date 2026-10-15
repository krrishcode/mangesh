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

export const metadata = {
  title: 'Menswear | Mangesh Mahadev',
  description:
    'Explore sherwanis, bandhgalas, kurtas and contemporary menswear from Mangesh Mahadev.',
};

export default function Page() {
  return (
    <>
      <HeaderInteractive />

      <main id="main" className="home-page">
        <h1 className="sr-only">Mangesh Mahadev menswear</h1>
        <HeroSlider />
        <CategoryGrid />
        <TwoColEditorial />
        <RunwayBanner />
        <MensWearBanner />
        <ProductCarousel />
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
