import { AppointmentBooking } from '@/components/AppointmentBooking';
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

export const metadata = {
  title: 'Buy Mens Designer Clothes, Sherwanis & Bandhgalas Online | Mangesh Mahadev',
  description:
    'Shop Indian luxury menswear online at Mangesh Mahadev. Explore royal sherwanis, imperial bandhgalas, silk kurta sets, and bespoke groomswear.',
};

export default function Page() {
  return (
    <>
      <HeaderInteractive />

      <main id="main">
        <HeroSlider />
        <CategoryGrid />
        <HandsFreeHeartsFull />
        <RunwayBanner />
        <MensWearBanner />
        <ProductCarousel />
        <InTheSpotlightGrid />
        <TwoColEditorial />
        <CelebsShowcase />
        <MoreToExplore />
        <ScheduleAppointmentBanner />
        <AppointmentBooking />
      </main>

      <Footer />
    </>
  );
}
