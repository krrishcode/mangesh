export interface MensProduct {
  id: string;
  stock: number;
  categorySlug: string;
  title: string;
  category: 'Sherwanis' | 'Bandhgalas' | 'Kurtas' | 'Nehru Jackets' | 'Tuxedos' | 'Trousers' | 'Shackets' | 'Accessories' | string;
  price: number; // in INR
  salePrice?: number | null;
  sku?: string;
  imageFront: string;
  imageDetail: string;
  color: string;
  colorHex?: string;
  craft: string;
  fabric?: string;
  description: string;
  badge?: string;
  sizes: string[];
  inStockSizes?: string[];
  readyToShip?: boolean;
  styleNumber?: string;
  measurements?: string;
  fabricContent?: string;
  componentsCount?: number;
  setIncludes?: string;
  washCare?: string;
  countryOfOrigin?: string;
  manufacturerAddress?: string;
  returnsPolicy?: string;
  disclaimer?: string;
  editorialStory?: string;
  styleNote?: string;
  deliveryMethod?: 'both' | 'home' | 'pickup' | string;
  colorVariants?: any;
  /** On-model shots first; the person-less hanger/flat shot always goes last. */
  gallery?: string[];
}

export interface HeroSlide {
  id: string;
  image: string;
  alt: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: 'https://cdn.mangeshmahadev.com/images/hero/luxury-sofa.webp',
    alt: 'Man wearing an embroidered kurta seated on a tufted leather sofa',
  },
  {
    id: 'slide-2',
    image: 'https://cdn.mangeshmahadev.com/images/hero/sunlit-courtyard.webp',
    alt: 'Three men wearing relaxed menswear in a sunlit courtyard',
  },
];
