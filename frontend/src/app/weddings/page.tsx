import Link from 'next/link';
import type { Metadata } from 'next';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';
import { PhotoGallery } from '@/components/PhotoGallery';
import { WEDDING_PHOTOS, WEDDING_COVER_ID } from '@/data/weddings';
import '@/styles/home.css';
import '@/styles/photo-gallery.css';

export const metadata: Metadata = {
  title: 'Wedding Gallery | Mangesh Mahadev',
  description: 'Browse wedding photographs from Mangesh Mahadev.',
};

export default function WeddingsPage() {
  return (
    <>
      <HeaderInteractive />
      <main id="main" className="photo-gallery-page">
        <div className="home-container">
          <nav aria-label="Breadcrumb" className="photo-gallery-breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Weddings</span>
          </nav>
          <div className="photo-gallery-intro">
            <h1>Weddings</h1>
            <a href="#wedding-gallery" className="home-action">
              View gallery
            </a>
          </div>
          <PhotoGallery
            photos={WEDDING_PHOTOS}
            coverId={WEDDING_COVER_ID}
            title="Weddings"
            galleryId="wedding-gallery"
            photoLabel="wedding"
          />
        </div>
      </main>
      <Footer compact />
    </>
  );
}
