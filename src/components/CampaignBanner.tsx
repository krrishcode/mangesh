import Link from 'next/link';

interface CampaignBannerProps {
  id: string;
  title: string;
  image: string;
  href: string;
  action: string;
  imagePosition?: string;
  imageHeight?: number;
  imageAspectRatio?: number;
  imageFit?: 'cover' | 'contain';
  imageAlt?: string;
  tall?: boolean;
}

export default function CampaignBanner({
  id,
  title,
  image,
  href,
  action,
  imagePosition,
  imageHeight,
  imageAspectRatio,
  imageFit = 'cover',
  imageAlt,
  tall = false,
}: CampaignBannerProps) {
  return (
    <section id={id} className="home-section" aria-labelledby={`${id}-title`}>
      <Link
        href={href}
        aria-label={action}
        className={`block w-full overflow-hidden bg-[#ECE8E1] ${tall ? 'aspect-[4/3] sm:aspect-[2035/1290] max-h-[780px]' : 'aspect-[4/3] sm:aspect-[2035/947] max-h-[640px]'}`}
        style={
          imageHeight
            ? { height: imageHeight, aspectRatio: 'auto', maxHeight: 'none' }
            : imageAspectRatio
              ? { aspectRatio: imageAspectRatio, maxHeight: 'none' }
              : undefined
        }
      >
        <img
          src={image}
          alt={imageAlt ?? `${title} campaign`}
          loading="lazy"
          className={`h-full w-full ${imageFit === 'contain' ? 'object-contain object-center' : 'object-cover object-top'}`}
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
      </Link>
      <div className="home-container">
        <div className="home-section-caption">
          <h2 id={`${id}-title`} className="home-heading">
            {title}
          </h2>
          <Link href={href} className="home-action">
            {action}
          </Link>
        </div>
      </div>
    </section>
  );
}
