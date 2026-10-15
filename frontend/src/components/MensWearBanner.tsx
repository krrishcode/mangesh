import CampaignBanner from './CampaignBanner';

export default function MensWearBanner() {
  return (
    <CampaignBanner
      id="denim"
      title="Denim collection"
      action="View the collection"
      href="/shop"
      image="/images/denim/denim-campaign-v1.webp"
      imageAspectRatio={1672 / 941}
      imageAlt="Denim collection: blue embroidered kurta and denim waistcoat in a warm cream interior"
    />
  );
}
