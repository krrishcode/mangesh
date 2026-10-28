import Link from 'next/link';

export default function RunwayBanner() {
  return (
    <section
      id="lookbook"
      className="home-section"
      aria-labelledby="runway-title"
    >
      <div className="relative h-[780px] overflow-hidden bg-[#1A1A1A]">
        <video
          src="https://cdn.mangeshmahadev.com/videos/runway.mp4"
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          aria-label="Mangesh Mahadev runway film"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="home-container">
        <div className="home-section-caption">
          <h2 id="runway-title" className="home-heading">
            Runway
          </h2>
          <Link href="/runway" className="home-action">
            Explore runway
          </Link>
        </div>
      </div>
    </section>
  );
}
