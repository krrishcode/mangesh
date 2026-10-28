import Link from 'next/link';

import { FooterCategories } from './FooterCategories';

const shopLinks: Array<[string, string]> = [
  ['All clothing', '/shop'],
  ['Runway', '/runway'],
  ['Weddings', '/weddings'],
  ['Celebrity looks', '/celebrities'],
];

const careLinks: Array<[string, string]> = [
  ['My account & orders', '/account'],
  ['Guest orders', '/track-order'],
];

const legalLinks: Array<[string, string]> = [
  ['Terms & Conditions', '/terms-and-conditions'],
  ['Privacy Policy', '/privacy-policy'],
];

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A880]';
const focusRingWide = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C5A880]';

const linkClass = `text-white/75 transition-colors hover:text-white hover:underline hover:underline-offset-4 hover:decoration-white/40 ${focusRing}`;

const smallLinkClass = `text-white/55 transition-colors hover:text-white hover:underline hover:underline-offset-4 hover:decoration-white/40 ${focusRing}`;

const columnHeadingClass = 'text-[10px] font-medium uppercase tracking-[0.24em] text-white/60';

function LinkColumn({ label, links }: { label: string; links: Array<[string, string]> }) {
  return (
    <nav aria-label={label}>
      <h2 className={columnHeadingClass}>{label}</h2>
      <ul className="mt-5 space-y-3 text-[13px]">
        {links.map(([text, href]) => (
          <li key={href}>
            <Link href={href} className={linkClass}>
              {text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-16 sm:px-6 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              aria-label="Mangesh Mahadev home"
              className={`inline-flex flex-col gap-2.5 ${focusRingWide}`}
            >
              <span className="font-serif text-[22px] leading-none tracking-[0.08em]">
                MANGESH MAHADEV
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/55">
                Couture &amp; Bespoke
              </span>
            </Link>

            <nav aria-label="Contact" className="mt-9 space-y-2.5 text-[13px]">
              <a href="mailto:care@shrutimangesh.com" className={`block w-fit ${linkClass}`}>
                care@shrutimangesh.com
              </a>
              <a href="tel:+919999313366" className={`block w-fit ${linkClass}`}>
                +91 99993 13366
              </a>
            </nav>

            <Link
              href="/#bespoke-appointment"
              className={`mt-9 inline-flex items-center gap-3 border-b border-[#C5A880] pb-1.5 text-[11px] uppercase tracking-[0.22em] text-[#C5A880] transition-colors hover:border-white hover:text-white ${focusRing}`}
            >
              Book an appointment
              <span aria-hidden="true">&rarr;</span>
            </Link>

            <p className="mt-9 text-[10px] uppercase tracking-[0.18em] text-white/55">
              Cash on delivery &middot; Pune, India
            </p>
          </div>

          <div className="lg:col-span-2">
            <LinkColumn label="Shop" links={shopLinks} />
          </div>

          <div className="lg:col-span-3">
            <FooterCategories />
          </div>

          <div className="lg:col-span-3">
            <LinkColumn label="Client care" links={careLinks} />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} House of Mangesh Mahadev Private Limited. All rights
            reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map(([text, href]) => (
              <Link key={href} href={href} className={smallLinkClass}>
                {text}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
