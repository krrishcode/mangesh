export interface MensProduct {
  id: string;
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
    image: '/images/hero/luxury-sofa.webp',
    alt: 'Man wearing an embroidered kurta seated on a tufted leather sofa',
  },
  {
    id: 'slide-2',
    image: '/images/hero/sunlit-courtyard.webp',
    alt: 'Three men wearing relaxed menswear in a sunlit courtyard',
  },
];

export const MENS_PRODUCTS: MensProduct[] = [
  {
    id: '101',
    title: 'Daydream Embroidered Zardozi Silk Bandhgala',
    category: 'Bandhgalas',
    price: 120000,
    imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw0edbbba5/images/hires/FW26/F26MP32J_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
    color: 'Off White',
    colorHex: '#EDE7DF',
    craft: 'Zardozi Gold-Thread & French Knots',
    description: 'An expression of soft florals in a sovereign garden. Handcrafted by master artisans in precious gold-thread work and French knots on pure raw silk.',
    badge: 'FW26 RUNWAY',
    sizes: ['38', '40', '42', '44', '46', '48'],
    inStockSizes: ['38', '42', '44', '46', '48'],
    readyToShip: true,
  },
  {
    id: '103',
    title: 'Fondness Embroidered Silk Nehru Jacket',
    category: 'Nehru Jackets',
    price: 75000,
    imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwfab212d9/images/hires/FW26/F26MP2B_SAGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw7de6a748/images/hires/FW26/F26MP2B_SAGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
    color: 'Sage',
    colorHex: '#9EAD9F',
    craft: 'Flora Aari & Dori Embroidery',
    description: 'Crafted in soothing sage mulberry silk, detailed with botanical floral motifs inspired by the royal gardens of Jaipur.',
    badge: 'FW26 RUNWAY',
    sizes: ['38', '40', '42', '44', '46', '48'],
    inStockSizes: ['38', '40', '42', '46', '48'],
    readyToShip: true,
  },
  {
    id: '104',
    title: 'Serenade Hand-embroidered Silk Nehru Jacket',
    category: 'Nehru Jackets',
    price: 60000,
    imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw9b989e97/images/hires/FW26/F26MP1B_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw117051cf/images/hires/FW26/F26MP1B_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
    color: 'Off White',
    colorHex: '#FAF6F0',
    craft: 'Marodi & Tone-on-Tone Threadwork',
    description: 'Subtle tone-on-tone marodi embroidery on fine ivory silk. Perfect for regal summer cocktail and mehendi soirees.',
    badge: 'READY TO SHIP',
    sizes: ['38', '40', '42', '44', '46', '48'],
    inStockSizes: ['38', '40', '42', '44'],
    readyToShip: true,
  },
  {
    id: '107',
    title: 'Forever Embroidered Mul Kurta Set',
    category: 'Kurtas',
    price: 45000,
    imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwa1347020/images/hires/FW26/F26MP4K_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
    imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwed6b3075/images/hires/FW26/F26MP4K_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
    color: 'Off White',
    colorHex: '#FCFAF7',
    craft: 'Fine Chikankari & Shadow Embroidery',
    description: 'Featherlight pure mulberry cotton-silk kurta set crafted with delicate floral yoke embroidery and mother-of-pearl buttons.',
    badge: 'READY TO SHIP',
    sizes: ['38', '40', '42', '44', '46', '48'],
    inStockSizes: ['38', '40', '42', '44', '46', '48'],
    readyToShip: true,
  },
  {
    id: '117',
    title: 'Maroon Embroidered Bandhgala Jacket & Trouser Set',
    category: 'Bandhgalas',
    price: 145000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'MMD-BGS-001',
    imageFront: '/products/maroon-bandhgala-set/maroon-bandhgala-01.webp',
    imageDetail: '/products/maroon-bandhgala-set/maroon-bandhgala-02.webp',
    color: 'Maroon',
    colorHex: '#4A0E17',
    craft: 'Gold-toned Ornamental Embroidery',
    description:
      'A sophisticated maroon bandhgala ensemble featuring a structured jacket with a refined high collar, ornate metallic buttons and a distinctive embroidered motif placed on the chest pocket. Subtle dark piping at the waist and cuffs adds definition to the clean tailored silhouette.\n\nPaired with matching tailored trousers, the ensemble creates a polished monochromatic look with a refined festive character. The intricate embroidery and structured construction make it an elegant choice for formal celebrations and special occasions.',
    sizes: ['M'],
    inStockSizes: ['M'],
    styleNumber: 'MMD-BGS-001',
    measurements: 'Size M · Bandhgala Length 30” · Trouser Length 39”',
    fabricContent: 'Italian Tery Wool',
    componentsCount: 2,
    setIncludes: '1 Bandhgala Jacket and 1 Trouser',
    washCare: 'Dry clean only. Do not bleach. Iron on low heat.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Pair with classic brown or black formal shoes and minimal accessories for a refined occasion look.',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-maroon',
        color: 'Maroon',
        colorHex: '#4A0E17',
        imageFront: '/products/maroon-bandhgala-set/maroon-bandhgala-01.webp',
        sizes: ['M'],
        inStockSizes: ['M'],
      },
    ],
    gallery: [
      '/products/maroon-bandhgala-set/maroon-bandhgala-01.webp',
      '/products/maroon-bandhgala-set/maroon-bandhgala-02.webp',
      '/products/maroon-bandhgala-set/maroon-bandhgala-03.webp',
      '/products/maroon-bandhgala-set/maroon-bandhgala-04.webp',
      '/products/maroon-bandhgala-set/maroon-bandhgala-05.webp',
      '/products/maroon-bandhgala-set/maroon-bandhgala-06.webp',
    ],
  },
  {
    id: '118',
    title: 'Terry Wool Bandi & Trouser Set',
    category: 'Nehru Jackets',
    price: 95000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'MMD-BND-001',
    imageFront: '/products/terry-wool-bandi/terry-wool-bandi-01.webp',
    imageDetail: '/products/terry-wool-bandi/terry-wool-bandi-02.webp',
    color: 'Black',
    colorHex: '#1C1917',
    craft: 'Tonal Embroidery on Terry Wool',
    description:
      'A contemporary black Bandi crafted in refined terry wool, featuring a structured band collar, clean front button closure, welt pockets, and an intricate embroidery detail placed beneath the chest pocket. The tailored construction gives the Bandi a polished and sophisticated character while retaining a versatile Indian silhouette.\n\nPaired with matching black terry wool trousers featuring a distinctive long belt detail, the set creates a sleek monochromatic look that transitions effortlessly between festive and formal occasions. The sharp tailoring, functional pocket detailing, and tonal embroidery add a refined modern character to the ensemble.',
    sizes: ['L'],
    inStockSizes: ['L'],
    styleNumber: 'MMD-BND-001',
    measurements: 'Size L · Bandi Length 31” · Trouser Length 43”',
    fabricContent: 'Terry Wool',
    componentsCount: 2,
    setIncludes: '1 Bandi and 1 Trouser',
    washCare: 'Dry clean only. Do not bleach. Iron on low to medium heat. Store in a cool, dry place away from direct sunlight.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Style with a crisp grey shirt for a sophisticated contemporary look. For a more relaxed Indo-western look, layer the Bandi over a plain kurta and finish with understated accessories such as a classic watch.',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-black',
        color: 'Black',
        colorHex: '#1C1917',
        imageFront: '/products/terry-wool-bandi/terry-wool-bandi-01.webp',
        sizes: ['L'],
        inStockSizes: ['L'],
      },
    ],
    gallery: [
      '/products/terry-wool-bandi/terry-wool-bandi-01.webp',
      '/products/terry-wool-bandi/terry-wool-bandi-02.webp',
      '/products/terry-wool-bandi/terry-wool-bandi-03.webp',
      '/products/terry-wool-bandi/terry-wool-bandi-04.webp',
      '/products/terry-wool-bandi/terry-wool-bandi-05.webp',
      '/products/terry-wool-bandi/terry-wool-bandi-06.webp',
    ],
  },
  {
    id: '119',
    title: 'Midnight Blue Georgette Bandi',
    category: 'Nehru Jackets',
    price: 85000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'MMD-BND-002',
    imageFront: '/products/midnight-blue-bandi/midnight-blue-bandi-01.webp',
    imageDetail: '/products/midnight-blue-bandi/midnight-blue-bandi-02.webp',
    color: 'Midnight Blue with Teal',
    colorHex: '#273C50',
    craft: 'Golden & Ivory Beadwork with Teal Brocade Border',
    description:
      'A sophisticated midnight blue Bandi featuring intricate golden and ivory beadwork embroidery arranged in distinctive vertical lines, complemented by a rich teal brocade border along the collar, front placket and hem. The structured silhouette and detailed craftsmanship create a refined contemporary interpretation of traditional Indian menswear.\n\nThe deep midnight blue georgette base, teal brocade accents and contrasting beadwork create an elegant statement. Designed as a versatile layer, the Bandi brings together traditional detailing with a contemporary Indo-western aesthetic, making it suitable for festive occasions, celebrations and evening dressing.',
    sizes: ['M'],
    inStockSizes: ['M'],
    styleNumber: 'MMD-BND-002',
    measurements: 'Size M · Bandi Length 29”',
    fabricContent: 'Georgette',
    componentsCount: 1,
    setIncludes: '1 Bandi',
    washCare: 'Dry clean only. Do not bleach. Iron on low to medium heat. Store in a cool, dry place away from direct sunlight.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Pair with a solid teal or ivory kurta and matching trousers for a refined festive look. It can also be styled with a crisp ivory shirt and tailored trousers for a contemporary Indo-western ensemble. Complete the look with brown or black leather loafers and minimal accessories.',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-midnight-blue',
        color: 'Midnight Blue with Teal',
        colorHex: '#273C50',
        imageFront: '/products/midnight-blue-bandi/midnight-blue-bandi-01.webp',
        sizes: ['M'],
        inStockSizes: ['M'],
      },
    ],
    gallery: [
      '/products/midnight-blue-bandi/midnight-blue-bandi-01.webp',
      '/products/midnight-blue-bandi/midnight-blue-bandi-02.webp',
      '/products/midnight-blue-bandi/midnight-blue-bandi-03.webp',
      '/products/midnight-blue-bandi/midnight-blue-bandi-04.webp',
      '/products/midnight-blue-bandi/midnight-blue-bandi-06.webp',
      '/products/midnight-blue-bandi/midnight-blue-bandi-05.webp',
    ],
  },
  {
    id: '120',
    title: 'Black & White Striped Bandi',
    category: 'Nehru Jackets',
    price: 55000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'MMD-BND-004',
    imageFront: '/products/black-white-striped-bandi/black-white-striped-bandi-01.webp',
    imageDetail: '/products/black-white-striped-bandi/black-white-striped-bandi-02.webp',
    color: 'Black & White',
    colorHex: '#1C1917',
    craft: 'Contrast Black Detailing on Striped Cotton',
    description:
      'A contemporary sleeveless Bandi featuring a refined black and white striped pattern, tailored with a sharp notched lapel and structured silhouette. Contrast black detailing along the lapel, pockets and front adds definition to the monochromatic design.\n\nThe clean tailoring and distinctive stripe placement give the Bandi a polished modern character, making it suitable for elevated formal and occasion dressing.',
    sizes: ['S'],
    inStockSizes: ['S'],
    styleNumber: 'MMD-BND-004',
    measurements: 'Size S · Bandi Length 28”',
    fabricContent: 'Cotton',
    componentsCount: 1,
    setIncludes: '1 Bandi',
    washCare: 'Dry clean only. Do not bleach. Iron on low heat.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Pair with a solid black or charcoal shirt and tailored trousers, or layer over a crisp white kurta with black trousers for a refined Indo-western look.',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-black-white',
        color: 'Black & White',
        colorHex: '#1C1917',
        imageFront: '/products/black-white-striped-bandi/black-white-striped-bandi-01.webp',
        sizes: ['S'],
        inStockSizes: ['S'],
      },
    ],
    gallery: [
      '/products/black-white-striped-bandi/black-white-striped-bandi-01.webp',
      '/products/black-white-striped-bandi/black-white-striped-bandi-02.webp',
      '/products/black-white-striped-bandi/black-white-striped-bandi-03.webp',
      '/products/black-white-striped-bandi/black-white-striped-bandi-04.webp',
      '/products/black-white-striped-bandi/black-white-striped-bandi-06.webp',
      '/products/black-white-striped-bandi/black-white-striped-bandi-07.webp',
      '/products/black-white-striped-bandi/black-white-striped-bandi-05.webp',
    ],
  },
  {
    // No brief in the Drive folder — only the folder name and 7 photos.
    // Colour and craft are read off the images; price and description are deliberately unset.
    id: '121',
    title: 'Ombré Matka Silk Bandi',
    category: 'Nehru Jackets',
    price: 0,
    salePrice: null,
    imageFront: '/products/ombre-matka-bandi/ombre-matka-bandi-02.webp',
    imageDetail: '/products/ombre-matka-bandi/ombre-matka-bandi-03.webp',
    color: 'Ivory',
    colorHex: '#DCC4AC',
    craft: 'Matka Silk',
    description: '',
    sizes: [],
    inStockSizes: [],
    countryOfOrigin: 'India',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-ombre',
        color: 'Ivory',
        colorHex: '#DCC4AC',
        imageFront: '/products/ombre-matka-bandi/ombre-matka-bandi-02.webp',
        sizes: [],
        inStockSizes: [],
      },
    ],
    gallery: [
      '/products/ombre-matka-bandi/ombre-matka-bandi-02.webp',
      '/products/ombre-matka-bandi/ombre-matka-bandi-03.webp',
      '/products/ombre-matka-bandi/ombre-matka-bandi-04.webp',
      '/products/ombre-matka-bandi/ombre-matka-bandi-05.webp',
      '/products/ombre-matka-bandi/ombre-matka-bandi-06.webp',
      '/products/ombre-matka-bandi/ombre-matka-bandi-07.webp',
      '/products/ombre-matka-bandi/ombre-matka-bandi-01.webp',
    ],
  },
  {
    id: '122',
    title: 'Aaroh Blue Deer Raw Silk Kurta',
    category: 'Kurtas',
    price: 32000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'MMD-KRT-001',
    imageFront: '/products/blue-deer-kurta/blue-deer-kurta-01.webp',
    imageDetail: '/products/blue-deer-kurta/blue-deer-kurta-02.webp',
    color: 'Aqua Blue with Ivory & Golden Deer Weave',
    colorHex: '#7EBCBF',
    craft: 'Ivory Woven Yoke with Deer Motifs',
    description:
      'A refined expression of contemporary Indian menswear, the Aaroh Kurta is crafted in lustrous blue raw silk, offering a subtle natural texture and understated richness. The kurta features a distinctive ivory woven yoke adorned with delicate deer motifs in a warm earthy tone, creating a sophisticated contrast against the serene blue base.\n\nA structured mandarin collar and clean front placket are finished with tonal detailing and refined buttons, while the relaxed straight silhouette and side slits lend ease to the traditional form. Designed for the modern wardrobe, the piece balances artisanal character with a polished, elevated aesthetic.',
    sizes: ['XL'],
    inStockSizes: ['XL'],
    styleNumber: 'MMD-KRT-001',
    measurements: 'Size XL · Kurta Length 41”',
    fabricContent: '100% Raw Silk',
    componentsCount: 1,
    setIncludes: '1 Kurta only',
    washCare: 'Dry clean only. Do not bleach. Iron on low to medium heat from the reverse side. Store in a cool, dry place away from direct sunlight.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Pair it with ivory trousers and classic leather loafers for an effortlessly sophisticated festive look. Ideal for intimate celebrations, festive gatherings, cultural occasions and elegant daytime events',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-aqua-blue',
        color: 'Aqua Blue with Ivory & Golden Deer Weave',
        colorHex: '#7EBCBF',
        imageFront: '/products/blue-deer-kurta/blue-deer-kurta-01.webp',
        sizes: ['XL'],
        inStockSizes: ['XL'],
      },
    ],
    gallery: [
      '/products/blue-deer-kurta/blue-deer-kurta-01.webp',
      '/products/blue-deer-kurta/blue-deer-kurta-02.webp',
      '/products/blue-deer-kurta/blue-deer-kurta-03.webp',
      '/products/blue-deer-kurta/blue-deer-kurta-04.webp',
      '/products/blue-deer-kurta/blue-deer-kurta-05.webp',
      '/products/blue-deer-kurta/blue-deer-kurta-06.webp',
      '/products/blue-deer-kurta/blue-deer-kurta-07.webp',
    ],
  },
  {
    id: '123',
    title: 'Phulkari Embroidered Cotton Denim Kurta',
    category: 'Kurtas',
    price: 26000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'HSM-K-001',
    imageFront: '/products/phulkari-kurta/phulkari-kurta-01.webp',
    imageDetail: '/products/phulkari-kurta/phulkari-kurta-02.webp',
    color: 'Charcoal Brown',
    colorHex: '#30241C',
    craft: 'Phulkari-inspired Geometric Embroidery',
    description:
      'A contemporary take on traditional Phulkari, this kurta brings together the rich character of handcrafted embroidery with the effortless appeal of cotton denim. The structured silhouette features a sharp collar, front zip closure and relaxed proportions, creating a distinctive Indo-Western aesthetic.\n\nIntricate Phulkari-inspired geometric embroidery in contrasting ivory, burnt orange and muted olive tones adds an artisanal yet modern character to the denim base. Designed for the contemporary wardrobe, the kurta can transition effortlessly from festive occasions to elevated casual dressing.',
    sizes: ['M'],
    inStockSizes: ['M'],
    styleNumber: 'HSM-K-001',
    measurements: 'Size M · Kurta Length 35”',
    fabricContent: 'Cotton Denim',
    componentsCount: 1,
    setIncludes: '1 Kurta only',
    washCare: 'Dry clean only. Do not bleach. Iron on low to medium heat. Avoid direct ironing over embroidery. Store in a cool, dry place away from direct sunlight.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Pair with off-white trousers, ivory trousers or light-shade denim for a contemporary Indo-Western look.',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-charcoal-brown',
        color: 'Charcoal Brown',
        colorHex: '#30241C',
        imageFront: '/products/phulkari-kurta/phulkari-kurta-01.webp',
        sizes: ['M'],
        inStockSizes: ['M'],
      },
    ],
    gallery: [
      '/products/phulkari-kurta/phulkari-kurta-01.webp',
      '/products/phulkari-kurta/phulkari-kurta-02.webp',
      '/products/phulkari-kurta/phulkari-kurta-03.webp',
      '/products/phulkari-kurta/phulkari-kurta-04.webp',
      '/products/phulkari-kurta/phulkari-kurta-05.webp',
      '/products/phulkari-kurta/phulkari-kurta-06.webp',
      '/products/phulkari-kurta/phulkari-kurta-07.webp',
      '/products/phulkari-kurta/phulkari-kurta-08.webp',
      '/products/phulkari-kurta/phulkari-kurta-09.webp',
    ],
  },
  {
    id: '124',
    title: 'Woven Textured Soft Cotton Pathani',
    category: 'Kurtas',
    price: 18000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'HSM-P-001',
    imageFront: '/products/woven-pathani-kurta/woven-pathani-kurta-01.webp',
    imageDetail: '/products/woven-pathani-kurta/woven-pathani-kurta-02.webp',
    color: 'Maroon',
    colorHex: '#570D0F',
    craft: 'Woven Textured Soft Cotton',
    description:
      'The Woven Textured Soft Cotton Pathani reimagines the classic Pathani silhouette through a contemporary lens, crafted in a rich maroon tone with a distinctive textured soft cotton fabric. The elongated, relaxed silhouette features a sharp shirt collar, front button placket and side slits, creating a refined yet effortless profile.\n\nThe tactile texture of the fabric adds depth and character to the clean silhouette, while the understated construction gives the piece a modern, sophisticated appeal. Designed for contemporary occasion dressing, this Pathani brings together traditional Indian proportions with a refined, Western-influenced aesthetic.',
    sizes: ['L'],
    inStockSizes: ['L'],
    styleNumber: 'HSM-P-001',
    measurements: 'Size L · Kurta Length 42”',
    fabricContent: 'Textured Soft Cotton',
    componentsCount: 1,
    setIncludes: '1 Pathani only',
    washCare: 'Dry clean only. Do not bleach. Iron on low to medium heat. Store in a cool, dry place away from direct sunlight.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Pair with black Patiala pants for a sophisticated contemporary occasion look.',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-maroon',
        color: 'Maroon',
        colorHex: '#570D0F',
        imageFront: '/products/woven-pathani-kurta/woven-pathani-kurta-01.webp',
        sizes: ['L'],
        inStockSizes: ['L'],
      },
    ],
    gallery: [
      '/products/woven-pathani-kurta/woven-pathani-kurta-01.webp',
      '/products/woven-pathani-kurta/woven-pathani-kurta-02.webp',
      '/products/woven-pathani-kurta/woven-pathani-kurta-03.webp',
      '/products/woven-pathani-kurta/woven-pathani-kurta-04.webp',
      '/products/woven-pathani-kurta/woven-pathani-kurta-05.webp',
      '/products/woven-pathani-kurta/woven-pathani-kurta-06.webp',
      '/products/woven-pathani-kurta/woven-pathani-kurta-07.webp',
    ],
  },
  {
    id: '125',
    title: 'Black & Ivory Embroidered Shacket',
    category: 'Shackets',
    price: 24000, // not in the client brief — confirm before this goes live
    salePrice: null,
    sku: 'MMD-SHK-001',
    imageFront: '/products/black-ivory-shacket/black-ivory-shacket-01.webp',
    imageDetail: '/products/black-ivory-shacket/black-ivory-shacket-02.webp',
    color: 'Black & Ivory',
    colorHex: '#1C1917',
    craft: 'Black Embroidery on Cotton',
    description:
      'A contemporary statement shacket crafted in cotton with a striking black embroidered design. The front open silhouette is defined by a tailored collar, full sleeves and neatly finished pockets, creating a polished yet relaxed profile.\n\nThe contrasting embroidery brings depth and artisanal character to the piece, while the open construction gives it an effortless, versatile appeal. Designed for elevated casual and occasion dressing, this shacket brings together contemporary tailoring and Indian-inspired craftsmanship.',
    sizes: ['M'],
    inStockSizes: ['M'],
    styleNumber: 'MMD-SHK-001',
    measurements: 'Size M · Shacket Length 23”',
    fabricContent: 'Cotton',
    componentsCount: 1,
    setIncludes: '1 Shacket',
    washCare: 'Dry clean only. Do not bleach. Iron on low heat. Store in a cool, dry place.',
    countryOfOrigin: 'India',
    manufacturerAddress:
      'House of Shruti Mangaaysh, Prabhat Road, Start of Lane 10, Pune - 411004',
    styleNote:
      'Wear open over a solid black or ivory shirt denims for a refined contemporary look. It can also be layered over a kurta and paired with relaxed trousers for an elevated Indo-western ensemble.',
    deliveryMethod: 'both',
    colorVariants: [
      {
        id: 'var-black-ivory',
        color: 'Black & Ivory',
        colorHex: '#1C1917',
        imageFront: '/products/black-ivory-shacket/black-ivory-shacket-01.webp',
        sizes: ['M'],
        inStockSizes: ['M'],
      },
    ],
    gallery: [
      '/products/black-ivory-shacket/black-ivory-shacket-01.webp',
      '/products/black-ivory-shacket/black-ivory-shacket-02.webp',
      '/products/black-ivory-shacket/black-ivory-shacket-03.webp',
      '/products/black-ivory-shacket/black-ivory-shacket-04.webp',
      '/products/black-ivory-shacket/black-ivory-shacket-05.webp',
      '/products/black-ivory-shacket/black-ivory-shacket-06.webp',
      '/products/black-ivory-shacket/black-ivory-shacket-07.webp',
      '/products/black-ivory-shacket/black-ivory-shacket-08.webp',
    ],
  },
];
