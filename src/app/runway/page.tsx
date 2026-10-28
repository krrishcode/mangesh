import Link from 'next/link';
import type { Metadata } from 'next';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { PhotoGallery } from '@/components/PhotoGallery';
import { RUNWAY_PHOTOS, RUNWAY_COVER_ID } from '@/data/runway';
import '@/styles/home.css';
import '@/styles/photo-gallery.css';

export const metadata: Metadata = {
  title: 'Runway Gallery | Mangesh Mahadev',
  description: 'Browse runway photographs from Mangesh Mahadev.',
};

export default function RunwayPage() {
  return (
    <>
      <HeaderInteractive />
      <main id="main" className="photo-gallery-page">
        <div className="home-container">
          <nav aria-label="Breadcrumb" className="photo-gallery-breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Runway</span>
          </nav>
          <div className="photo-gallery-intro">
            <h1>Runway</h1>
            <a href="#runway-gallery" className="home-action">
              View gallery
            </a>
          </div>
          <PhotoGallery
            photos={RUNWAY_PHOTOS}
            coverId={RUNWAY_COVER_ID}
            title="Runway"
            galleryId="runway-gallery"
            photoLabel="runway"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
