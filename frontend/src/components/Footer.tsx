import Link from 'next/link';

export default function Footer({ compact = false }: { compact?: boolean }) {
  {
    const shopLinks = [['All clothing', '/shop'], ['Runway', '/runway'], ['Weddings', '/weddings']];
    return (
      <footer className="border-t border-[#DED8D0] bg-[#FAF8F5] text-[#333333]">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 text-[13px] sm:grid-cols-[2fr_1fr_1fr]">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="text-lg tracking-[0.12em]">MANGESH MAHADEV</Link>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-medium">Shop</h2>
              <ul className="space-y-2.5 text-[#706B65]">
                {shopLinks.map(([label, href]) => (
                  <li key={href}><Link href={href} className="hover:text-primary-foreground">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-medium">Customer care</h2>
              <ul className="space-y-2.5 text-[#706B65]">
                <li><Link href="/account" className="hover:text-primary-foreground">My account & orders</Link></li>
                <li><Link href="/track-order" className="hover:text-primary-foreground">Guest orders</Link></li>
                <li><Link href="/#bespoke-appointment" className="hover:text-primary-foreground">Book an appointment</Link></li>
                <li><a href="mailto:care@shrutimangesh.com" className="hover:text-primary-foreground">Email us</a></li>
                <li><a href="tel:+919999313366" className="hover:text-primary-foreground">+91 99993 13366</a></li>
              </ul>
            </div>
          </div>
          <p className="mt-10 border-t border-[#DED8D0] pt-5 text-[11px] text-[#706B65]">
            © {new Date().getFullYear()} House of Mangesh Mahadev Private Limited. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

}
