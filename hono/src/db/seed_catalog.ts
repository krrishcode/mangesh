import { db } from './index.js';
import { categories, products, orders, orderItems, users, appointments, reviews, adminSettings } from './schema/index.js';
import { eq, sql } from 'drizzle-orm';
import { hashPassword } from '../lib/auth.js';

export async function seedCatalog() {
  console.log('Seeding categories...');
  const categoryDefs = [
    { name: 'Sherwanis', slug: 'sherwanis', description: 'Regal bridal & occasion sherwanis with royal zardozi & resham craft' },
    { name: 'Bandhgalas', slug: 'bandhgalas', description: 'Imperial structured silhouettes for sovereign lifetime celebrations' },
    { name: 'Kurtas', slug: 'kurtas', description: 'Heirloom hand-spun silk and chanderi kurtas for ceremonial gatherings' },
    { name: 'Nehru Jackets', slug: 'nehru-jackets', description: 'Finely tailored silk bundi jackets with botanical motifs' },
    { name: 'Tuxedos', slug: 'tuxedos', description: 'Contemporary evening cocktail wear tailored with Italian velvet' },
    { name: 'Bottoms', slug: 'bottoms', description: 'Bespoke aligarhi trousers, classic breeches, and silk churidars' },
    { name: 'Accessories', slug: 'accessories', description: 'Handcrafted safas, silk pocket squares, stoles, and jeweled buttons' },
  ];

  const categoryMap = new Map<string, number>();

  for (const cat of categoryDefs) {
    const [existing] = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
    if (!existing) {
      const [res] = await db.insert(categories).values(cat);
      categoryMap.set(cat.name, res.insertId);
    } else {
      categoryMap.set(cat.name, existing.id);
    }
  }

  console.log('Seeding products...');
  const catalogProducts = [
    {
      title: 'Daydream Embroidered Zardozi Silk Bandhgala',
      slug: 'daydream-embroidered-zardozi-silk-bandhgala',
      category: 'Bandhgalas',
      price: '120000.00',
      salePrice: null,
      stock: 12,
      sku: 'MM-BDG-101',
      description: 'An expression of soft florals in a sovereign garden. Handcrafted by master artisans in precious gold-thread work and French knots on pure raw silk.',
    },
    {
      title: 'Kindred Embroidered Zardozi Silk Sherwani',
      slug: 'kindred-embroidered-zardozi-silk-sherwani',
      category: 'Sherwanis',
      price: '290000.00',
      salePrice: '275000.00',
      stock: 8,
      sku: 'MM-SHR-102',
      styleNumber: 'F26MP8',
      imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
      imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw6c58fa09/images/hires/FW26/F26MP8SR_BEIGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
      color: 'Beige',
      colorHex: '#D6C7B2',
      craft: 'Imperial Metallic Zardozi & Resham',
      badge: 'EXCLUSIVE',
      sizes: JSON.stringify(['38', '40', '42', '44', '46', '48']),
      inStockSizes: JSON.stringify(['38', '40', '42', '44', '46']),
      readyToShip: true,
      description: 'A sovereign heirloom piece in raw silk adorned with dense Mughal vine embroidery, paired with a hand-spun churidar and tissue silk stole.',
      editorialStory: 'Zardozi has existed in India since the time of the Rig Veda and reached its peak under Mughal patronage. A form of metal-thread embroidery whose name comes from two Urdu words — zar, meaning gold, and doz, meaning hand-work or embroidery. Once used to enrich the attire of kings, its floral motifs worked in gold and soft-coloured thread were drawn from Mughal court paintings & dressed generations of nobility.\n\nOur Kindred Sherwani from the Love All F/W 2026 collection is an expression of soft florals in a sovereign garden.',
      measurements: 'Sherwani Length - 110 cm (43.3 In)\nChuridar Fabric - 250 cm (2.5 Mtrs)\nDraped Stole - 250 cm (2.5 Mtrs)',
      fabricContent: '100% Silk + Lining : 100% Viscose',
      componentsCount: 3,
      setIncludes: 'Hand-embroidered Sherwani, Churidar Fabric & Handcrafted Silk Stole',
      washCare: 'Dry Clean / Spot Clean',
      countryOfOrigin: 'India',
      manufacturerAddress: 'House of Mangesh Mahadev Private Limited, Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India - 400701.',
      returnsPolicy: 'This item is not eligible for return or exchange. Custom tailored couture fittings available.',
      disclaimer: 'The colour of the product may vary slightly from how it appears here. This may be due to different display settings on various devices and also because of any lighting filters or special effects used during the shoot.',
      deliveryMethod: 'both',
      colorVariants: JSON.stringify([
        {
          id: 'var-beige',
          color: 'Beige',
          colorHex: '#D6C7B2',
          imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
          sizes: ['38', '40', '42', '44', '46', '48'],
          inStockSizes: ['38', '40', '42', '44', '46'],
        },
        {
          id: 'var-black',
          color: 'Black',
          colorHex: '#1C1917',
          imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
          sizes: ['40', '44'],
          inStockSizes: ['40', '44'],
        },
        {
          id: 'var-blue',
          color: 'Royal Blue',
          colorHex: '#1E3A8A',
          imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
          sizes: ['38', '40'],
          inStockSizes: ['38'],
        },
      ]),
    },
    {
      title: 'Fondness Embroidered Silk Nehru Jacket',
      slug: 'fondness-embroidered-silk-nehru-jacket',
      category: 'Nehru Jackets',
      price: '75000.00',
      salePrice: null,
      stock: 15,
      sku: 'MM-NHR-103',
      description: 'Crafted in soothing sage mulberry silk, detailed with botanical floral motifs inspired by the royal gardens of Jaipur.',
    },
    {
      title: 'Serenade Hand-embroidered Silk Nehru Jacket',
      slug: 'serenade-hand-embroidered-silk-nehru-jacket',
      category: 'Nehru Jackets',
      price: '60000.00',
      salePrice: null,
      stock: 18,
      sku: 'MM-NHR-104',
      description: 'Subtle tone-on-tone marodi embroidery on fine ivory silk. Perfect for regal summer cocktail and mehendi soirees.',
    },
    {
      title: 'Entwine Hand-painted Pichhwai Sherwani',
      slug: 'entwine-hand-painted-pichhwai-sherwani',
      category: 'Sherwanis',
      price: '170000.00',
      salePrice: null,
      stock: 4,
      sku: 'MM-SHR-105',
      description: 'Hand-painted in Rajasthan by 7th-generation master Pichhwai artists with natural mineral pigments on tailored raw silk.',
    },
    {
      title: 'Embrace Embroidered Velvet Bandhgala',
      slug: 'embrace-embroidered-velvet-bandhgala',
      category: 'Bandhgalas',
      price: '145000.00',
      salePrice: '135000.00',
      stock: 9,
      sku: 'MM-BDG-106',
      description: 'Crafted in deep midnight navy micro-velvet, featuring sovereign gold bullion thread embroidery along the imperial collar and cuffs.',
    },
    {
      title: 'Sovereign Raw Silk Kurta Set',
      slug: 'sovereign-raw-silk-kurta-set',
      category: 'Kurtas',
      price: '48000.00',
      salePrice: null,
      stock: 22,
      sku: 'MM-KRT-107',
      description: 'A timeless silhouette in handwoven blush mulberry silk featuring subtle chikankari threadwork paired with slim churidar.',
    },
    {
      title: 'Mirage Imperial Brocade Sherwani',
      slug: 'mirage-imperial-brocade-sherwani',
      category: 'Sherwanis',
      price: '320000.00',
      salePrice: null,
      stock: 3,
      sku: 'MM-SHR-108',
      description: 'Woven with gold and silver zari in traditional Banarasi brocade, lined with mulberry silk and finished with hand-crafted gem buttons.',
    },
  ];

  const productMap = new Map<string, number>();
  const removedDemoProductSlugs = new Set([
    'kindred-embroidered-zardozi-silk-sherwani',
    'entwine-hand-painted-pichhwai-sherwani',
  ]);

  for (const prod of catalogProducts) {
    if (removedDemoProductSlugs.has(prod.slug)) continue;
    const catId = categoryMap.get(prod.category) ?? null;
    const [existing] = await db.select().from(products).where(eq(products.slug, prod.slug)).limit(1);
    const prodValues: any = {
      title: prod.title,
      slug: prod.slug,
      description: prod.description,
      price: prod.price,
      salePrice: prod.salePrice,
      stock: prod.stock,
      sku: prod.sku,
      categoryId: catId,
      isActive: true,
      imageFront: (prod as any).imageFront || null,
      imageDetail: (prod as any).imageDetail || null,
      color: (prod as any).color || null,
      colorHex: (prod as any).colorHex || null,
      craft: (prod as any).craft || null,
      badge: (prod as any).badge || null,
      sizes: (prod as any).sizes || null,
      inStockSizes: (prod as any).inStockSizes || null,
      readyToShip: (prod as any).readyToShip !== undefined ? (prod as any).readyToShip : true,
      editorialStory: (prod as any).editorialStory || null,
      styleNumber: (prod as any).styleNumber || null,
      measurements: (prod as any).measurements || null,
      fabricContent: (prod as any).fabricContent || null,
      componentsCount: (prod as any).componentsCount || 1,
      setIncludes: (prod as any).setIncludes || null,
      washCare: (prod as any).washCare || null,
      countryOfOrigin: (prod as any).countryOfOrigin || 'India',
      manufacturerAddress: (prod as any).manufacturerAddress || null,
      returnsPolicy: (prod as any).returnsPolicy || null,
      disclaimer: (prod as any).disclaimer || null,
      deliveryMethod: (prod as any).deliveryMethod || 'both',
      colorVariants: (prod as any).colorVariants || null,
    };

    if (!existing) {
      const [res] = await db.insert(products).values(prodValues);
      productMap.set(prod.title, res.insertId);
    } else {
      await db.update(products).set(prodValues).where(eq(products.id, existing.id));
      productMap.set(prod.title, existing.id);
    }
  }

  console.log('Seeding customer accounts...');
  const customersList = [
    { name: 'Kavya Singhania', email: 'kavya.singhania@example.com', phone: '+91 98200 11223' },
    { name: 'Vikramaditya Roy', email: 'vikram.roy@example.com', phone: '+91 98111 44556' },
    { name: 'Rohan Mehra', email: 'rohan.mehra@example.com', phone: '+91 97654 32109' },
    { name: 'Ananya Deshmukh', email: 'ananya.d@example.com', phone: '+91 99887 76655' },
  ];

  const defaultPasswordHash = await hashPassword('password123');
  const userIds: number[] = [];

  for (const c of customersList) {
    const [existing] = await db.select().from(users).where(eq(users.email, c.email)).limit(1);
    if (!existing) {
      const [res] = await db.insert(users).values({
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash: defaultPasswordHash,
        role: 'customer',
      });
      userIds.push(res.insertId);
    } else {
      userIds.push(existing.id);
    }
  }

  console.log('Seeding appointments...');
  const sampleAppointments = [
    {
      userId: userIds[0] || 1,
      location: 'South Mumbai Flagship Atelier (Colaba)',
      occasion: 'Bridal Wedding Ceremony',
      scheduledAt: new Date(Date.now() + 86400000 * 3), // 3 days ahead
      status: 'upcoming' as const,
      notes: 'Bespoke fitting for Groom & Father of the Groom.',
    },
    {
      userId: userIds[1] || 1,
      location: 'New Delhi Mehrauli Suite',
      occasion: 'Grand Sangeet Night',
      scheduledAt: new Date(Date.now() + 86400000 * 7), // 7 days ahead
      status: 'upcoming' as const,
      notes: 'Requires matching hand-embroidered safa and stole.',
    },
    {
      userId: userIds[2] || 1,
      location: 'Bangalore Indiranagar Lounge',
      occasion: 'Evening Reception Gala',
      scheduledAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      status: 'completed' as const,
      notes: 'Fitting completed. Sent for final master pressing.',
    },
  ];

  for (const app of sampleAppointments) {
    const [existing] = await db.select().from(appointments).where(
      sql`${appointments.userId} = ${app.userId} AND ${appointments.occasion} = ${app.occasion}`
    ).limit(1);
    if (!existing) {
      await db.insert(appointments).values(app);
    }
  }

  console.log('Seeding orders...');
  const sampleOrders = [
    {
      userId: userIds[0] || 1,
      totalAmount: '290000.00',
      status: 'processing' as const,
      items: [
        { title: 'Kindred Embroidered Zardozi Silk Sherwani', quantity: 1, price: '290000.00' },
      ],
    },
    {
      userId: userIds[1] || 1,
      totalAmount: '195000.00',
      status: 'delivered' as const,
      items: [
        { title: 'Daydream Embroidered Zardozi Silk Bandhgala', quantity: 1, price: '120000.00' },
        { title: 'Fondness Embroidered Silk Nehru Jacket', quantity: 1, price: '75000.00' },
      ],
    },
    {
      userId: userIds[2] || 1,
      totalAmount: '60000.00',
      status: 'shipped' as const,
      items: [
        { title: 'Serenade Hand-embroidered Silk Nehru Jacket', quantity: 1, price: '60000.00' },
      ],
    },
  ];

  for (const ord of sampleOrders) {
    const [existing] = await db.select().from(orders).where(
      sql`${orders.userId} = ${ord.userId} AND ${orders.totalAmount} = ${ord.totalAmount}`
    ).limit(1);

    if (!existing) {
      const [res] = await db.insert(orders).values({
        userId: ord.userId,
        totalAmount: ord.totalAmount,
        status: ord.status,
      });
      for (const item of ord.items) {
        await db.insert(orderItems).values({
          orderId: res.insertId,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        });
      }
    }
  }

  console.log('Seeding reviews...');
  const firstProdId = Array.from(productMap.values())[0] || 1;
  const secondProdId = Array.from(productMap.values())[1] || 2;

  const sampleReviews = [
    {
      userId: userIds[0] || 1,
      productId: firstProdId,
      rating: 5,
      title: 'Breathtaking embroidery and immaculate fit',
      body: 'Wore this for my sangeet ceremony in Udaipur. The gold thread zardozi reflects lights magnificently and the silk feels sovereign.',
      status: 'approved' as const,
    },
    {
      userId: userIds[1] || 1,
      productId: secondProdId,
      rating: 5,
      title: 'Unmatched imperial craftsmanship',
      body: 'The detailing on the collar and the churidar pairing are perfection. Truly couture level.',
      status: 'approved' as const,
    },
    {
      userId: userIds[2] || 1,
      productId: firstProdId,
      rating: 4,
      title: 'Luxurious silk fabric, prompt delivery',
      body: 'Fitting was seamless right out of the box. Highly recommend the bespoke fitting consultation.',
      status: 'pending' as const,
    },
  ];

  for (const rev of sampleReviews) {
    const [existing] = await db.select().from(reviews).where(
      sql`${reviews.userId} = ${rev.userId} AND ${reviews.title} = ${rev.title}`
    ).limit(1);
    if (!existing) {
      await db.insert(reviews).values(rev);
    }
  }

  console.log('Catalog seeding complete!');
}

seedCatalog().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
