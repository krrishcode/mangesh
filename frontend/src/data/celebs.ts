export interface CelebLook {
  id: number;
  celebName: string;
  occasion: string;
  outfitName: string;
  image: string;
}

export const CELEB_LOOKS: CelebLook[] = [
  {
    id: 1,
    celebName: 'RANBIR KAPOOR',
    occasion: 'Grand Reception Gala',
    outfitName: 'Custom Hand-woven Ivory Zardozi Sherwani',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
  },
  {
    id: 2,
    celebName: 'VICKY KAUSHAL',
    occasion: 'Royal Palace Pheras',
    outfitName: 'Imperial Antique Kasab Sherwani',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
  },
  {
    id: 3,
    celebName: 'SIDHARTH MALHOTRA',
    occasion: 'Bespoke Sangeet Night',
    outfitName: 'Sage Chanderi Bundi & Kurta Set',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwfab212d9/images/hires/FW26/F26MP2B_SAGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
  },
  {
    id: 4,
    celebName: 'ADITYA ROY KAPUR',
    occasion: 'Black Tie Soirée',
    outfitName: 'Firelight Silk Cocktail Tuxedo',
    image: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw83bb767f/images/hires/FW26/F26MP31J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
  },
];
