export default function ScheduleAppointmentBanner() {
  return (
    <>
      <section
        id="appointment-banner"
        className="w-full relative overflow-hidden bg-[#1A1A1A] scroll-mt-28"
      >
        <div className="relative w-full h-[60vh] min-h-[420px] max-h-[640px]">
          <img
            src="https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-AD-INDIA-Library/default/dwbbc9085b/images/Home%20page/Apr2024/NewHomepage/Book_An_appointment_New%20Home%20page%20AD26april2024.jpg"
            alt="Schedule Atelier Appointment"
            loading="lazy"
            className="w-full h-full object-cover object-top filter brightness-95"
          />
          <div className="absolute inset-0 bg-black/25" />

          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div className="max-w-xl text-white">
              <span className="font-sans-clean text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-secondary block mb-3 font-medium">
                BESPOKE GROOM ATELIER
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl tracking-[0.10em] uppercase font-light text-white mb-5">
                SCHEDULE AN APPOINTMENT
              </h2>
              <p className="font-serif-luxury text-sm sm:text-base text-gray-200 mb-6 font-light leading-relaxed">
                Private styling consultations across Mumbai, New Delhi, London &
                NYC.
              </p>
              <a
                href="https://api.whatsapp.com/send?phone=919999313366&text=Hello%2C%20I%20would%20like%20to%20request%20a%20styling%20appointment."
                target="_blank"
                rel="noopener noreferrer"
                className="home-action home-action-on-image"
              >
                Book consultation
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
