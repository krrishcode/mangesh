import type { Metadata } from 'next';
import { HeaderInteractive } from '@/components/HeaderInteractive';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Careers | Join the Atelier | MANGESH MAHADEV',
  description:
    'Join the House of Mangesh Mahadev. Open roles across the bespoke atelier, hand-embroidery workshop, pattern room and digital studio in Mumbai, New Delhi, London and New York.',
};

const CARE_EMAIL = 'care@shrutimangesh.com';

interface Opening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
}

const OPENINGS: Opening[] = [
  {
    id: 'master-cutter',
    title: 'Master Cutter & Couture Tailor',
    department: 'Atelier',
    location: 'Mumbai (Kala Ghoda)',
    type: 'Full-time',
  },
  {
    id: 'zardozi-artisan',
    title: 'Zardozi Hand-Embroidery Artisan',
    department: 'Craft Workshop',
    location: 'Mumbai (Kala Ghoda)',
    type: 'Full-time',
  },
  {
    id: 'pattern-maker',
    title: 'Pattern Maker & Grader',
    department: 'Atelier',
    location: 'Mumbai (Kala Ghoda)',
    type: 'Full-time',
  },
  {
    id: 'client-stylist',
    title: 'Bespoke Client Stylist',
    department: 'Private Client Services',
    location: 'New Delhi (Mehrauli)',
    type: 'Full-time',
  },
  {
    id: 'merch-planning',
    title: 'Merchandise Planning Associate',
    department: 'Commercial',
    location: 'Mumbai',
    type: 'Full-time',
  },
  {
    id: 'digital-coordinator',
    title: 'E-commerce & Digital Studio Coordinator',
    department: 'Digital Studio',
    location: 'Mumbai / Remote',
    type: 'Contract',
  },
];

const HIRE_STEPS = [
  {
    step: '01',
    title: 'Portfolio Review',
    body: 'We read every submission ourselves. Craft portfolios, photographs of finished garments and pattern drafts tell us more than a résumé.',
  },
  {
    step: '02',
    title: 'Atelier Conversation',
    body: 'A working session at the atelier with the department head, held in person wherever the role is based.',
  },
  {
    step: '03',
    title: 'Trial Engagement',
    body: 'Paid trial work on a live commission before any permanent offer is made, so both sides see the craft first-hand.',
  },
];

function applyHref(subject: string) {
  return `mailto:${CARE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    'Please find my CV attached.\n\nName:\nCurrent role / studio:\nYears of experience:\nPortfolio or work link:\n',
  )}`;
}

export default function CareersPage() {
  return (
    <>
      <HeaderInteractive />

      <main id="main" className="min-h-screen">
        {/* Page Header */}
        <section className="pt-20 pb-14 bg-[#FAF8F5]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto">
              <p className="font-sans-clean text-[10px] tracking-[0.24em] text-[#997950] uppercase mb-5">
                House of Mangesh Mahadev
              </p>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[44px] tracking-[0.14em] text-[#333333] font-light uppercase leading-tight">
                Careers at the Atelier
              </h1>
              <p className="font-sans-clean text-[11px] sm:text-xs text-[#333333] leading-relaxed font-light mt-6">
                We make heirloom menswear by hand — sherwanis, bandhgalas and silks for
                lifetime celebrations. Our teams work between the cutting table, the
                embroidery adda and a small digital studio. If you practise a craft with
                patience, we would like to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-20 bg-[#FAF8F5] border-t border-[#E0D7CD]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.14em] text-[#333333] font-light uppercase">
                Current Openings
              </h2>
            </div>

            <ul className="max-w-5xl mx-auto divide-y divide-[#E0D7CD] border-y border-[#E0D7CD]">
              {OPENINGS.map((role) => (
                <li
                  key={role.id}
                  className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start"
                >
                  <div className="md:col-span-5">
                    <h3 className="font-sans-clean text-xs sm:text-[13px] tracking-[0.14em] text-[#333333] uppercase font-medium leading-relaxed">
                      {role.title}
                    </h3>
                    <p className="font-sans-clean text-[10px] tracking-[0.18em] text-[#997950] uppercase mt-2">
                      {role.department}
                    </p>
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <p className="font-sans-clean text-[11px] font-light tracking-[0.06em] text-[#333333]">
                      {role.location}
                    </p>
                    <p className="font-sans-clean text-[11px] font-light tracking-[0.06em] text-[#78716C]">
                      {role.type}
                    </p>
                  </div>

                  <div className="md:col-span-3 md:text-right">
                    <a
                      href={applyHref(`Application — ${role.title}`)}
                      className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.20em] text-[#333333] hover:text-[#4A0E17] transition border-b border-[#1A1A1A] hover:border-[#4A0E17] pb-1 uppercase"
                    >
                      <span>Send your CV</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-center font-sans-clean text-[11px] font-light tracking-[0.06em] text-[#333333] mt-12">
              Do not see your discipline listed? Write to us — we keep the workshop roster
              open for exceptional craft.
            </p>
            <div className="text-center mt-5">
              <a
                href={applyHref('General Application — House of Mangesh Mahadev')}
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.20em] text-[#4A0E17] hover:text-[#32070E] transition border-b border-[#4A0E17] pb-1 uppercase"
              >
                <span>Apply to the house</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </section>

        {/* How We Hire */}
        <section className="py-20 bg-[#F3EFEA]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[40px] tracking-[0.14em] text-[#333333] font-light uppercase">
                How We Hire
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 max-w-5xl mx-auto">
              {HIRE_STEPS.map((item) => (
                <div key={item.step} className="text-center md:text-left">
                  <p className="font-serif-luxury text-[13px] tracking-[0.20em] text-[#997950] mb-4">
                    {item.step}
                  </p>
                  <h3 className="font-sans-clean text-[11px] sm:text-xs tracking-[0.20em] text-[#333333] uppercase font-medium mb-4">
                    {item.title}
                  </h3>
                  <p className="font-sans-clean text-[11px] font-light tracking-[0.04em] text-[#333333] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Craft Note */}
        <section className="py-20 bg-[#FAF8F5] border-t border-[#E0D7CD]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif-luxury text-2xl sm:text-3xl tracking-[0.12em] text-[#333333] font-light uppercase leading-tight mb-6">
                Before You Apply
              </h2>
              <p className="font-sans-clean text-[11px] sm:text-xs font-light tracking-[0.04em] text-[#333333] leading-relaxed">
                Applications reach the studio by email. Attach your CV as a PDF and include
                links or photographs of work you have personally made — for workshop roles,
                close-up detail of finish and handwork matters far more than where you have
                worked. Please send one application per role.
              </p>
              <p className="font-sans-clean text-[11px] sm:text-xs font-light tracking-[0.04em] text-[#333333] leading-relaxed mt-5">
                We reply to every applicant within three working weeks.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
