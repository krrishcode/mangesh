import Link from 'next/link';

import { CELEB_LOOKS } from '@/data/celebs';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Celebrity Archives | Mangesh Mahadev',
  description:
    'Discover celebrated gentlemen in handcrafted Mangesh Mahadev couture, from bespoke sherwanis to modern ceremonial menswear.',
};

export default function CelebritiesPage() {
  return (
    <>
      <HeaderInteractive />

      <main id="main" className="bg-[#FAF8F5]">
        <section className="pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <header className="max-w-3xl mx-auto text-center">
              <p className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.24em] text-[#66141F] uppercase">
                CELEBRITY ARCHIVE
              </p>
              <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-[64px] tracking-[0.14em] text-[#333333] font-light uppercase mt-5">
                CELEBS IN MANGESH MAHADEV
              </h1>
              <p className="font-sans-clean text-[11px] sm:text-xs text-[#555555] tracking-[0.08em] mt-6 font-light leading-loose max-w-2xl mx-auto normal-case">
                A closer look at four looks from the Mangesh Mahadev archive.
              </p>
            </header>

            <div id="celebrity-looks" className="mt-20 sm:mt-28 lg:mt-36 space-y-24 sm:space-y-32 lg:space-y-40">
              {CELEB_LOOKS.map((celeb, index) => {
                const isImageLeft = index % 2 === 0;

                return (
                  <article key={celeb.id} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                    <div
                      className={`lg:col-span-6 ${
                        isImageLeft ? 'lg:col-start-1' : 'lg:col-start-7 lg:order-2'
                      }`}
                    >
                      <div className="relative aspect-[3/4.2] overflow-hidden bg-[#ECE8E1]">
                        <img
                          src={celeb.image}
                          alt={`${celeb.celebName} in ${celeb.outfitName}`}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out hover:scale-[1.02]"
                        />
                      </div>
                    </div>

                    <div
                      className={`lg:col-span-5 ${
                        isImageLeft ? 'lg:col-start-8' : 'lg:col-start-1 lg:row-start-1'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <span className="font-sans-clean text-[10px] tracking-[0.18em] text-[#66141F]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="h-px w-12 bg-[#C5A880]" />
                        <span className="font-sans-clean text-[10px] tracking-[0.18em] text-[#777777] uppercase">
                          LOOK {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <h2 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl tracking-[0.12em] text-[#333333] font-light uppercase">
                        {celeb.celebName}
                      </h2>
                      <p className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.16em] text-[#66141F] uppercase mt-4">
                        {celeb.occasion}
                      </p>
                      <p className="font-serif-story text-sm sm:text-base text-[#555555] mt-8 leading-relaxed">
                        {celeb.outfitName}
                      </p>

                      <a
                        href="#bespoke-appointment"
                        className="inline-flex items-center gap-3 mt-10 text-[11px] font-medium tracking-[0.18em] text-[#333333] uppercase hover:text-[#4A0E17] transition-colors"
                      >
                        BOOK A BESPOKE FITTING
                        <span aria-hidden="true" className="text-base leading-none">→</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="bespoke-appointment" className="border-t border-[#EAE3DB] bg-[#4A0E17] text-white py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-sans-clean text-[10px] tracking-[0.22em] text-[#E6C69C] uppercase">
              THE ATELIER
            </p>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl tracking-[0.14em] font-light uppercase mt-5">
              MADE FOR YOUR OCCASION
            </h2>
            <p className="font-sans-clean text-[11px] sm:text-xs tracking-[0.08em] text-white/75 leading-loose mt-5 font-light normal-case">
              Personal fittings, custom embroidery, and made-to-measure styling by appointment.
            </p>
            <Link
              href="/#bespoke-appointment"
              className="inline-block mt-9 px-10 py-3.5 border border-white text-white hover:bg-white hover:text-[#4A0E17] transition-all text-[11px] font-medium tracking-[0.18em] uppercase"
            >
              BOOK AN ATELIER CONSULTATION
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
