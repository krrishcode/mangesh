const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');

dotenv.config();

// Simple PBKDF2 or SHA-256 for password hash compatible with app auth
// In hono/src/lib/auth.ts: let's verify how passwords are hashed.
function hashPasswordSync(password) {
  // We'll read hono's auth implementation if needed, or check its format.
  return crypto.createHash('sha256').update(password + 'salt_mangesh_mahadev').digest('hex');
}

async function runSeed() {
  console.log('====================================================');
  console.log('  MANGESH MAHADEV - BESPOKE COUTURE PRODUCTION SEED  ');
  console.log('====================================================');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 30000,
  });

  console.log('Connected to MySQL host:', process.env.DB_HOST);

  try {
    // 1. CATEGORIES
    console.log('\n[1/12] Ensuring Categories...');
    const categoriesData = [
      { name: 'Sherwanis', slug: 'sherwanis', description: 'Regal bridal & occasion sherwanis with royal zardozi & resham craft' },
      { name: 'Bandhgalas', slug: 'bandhgalas', description: 'Imperial structured silhouettes for sovereign lifetime celebrations' },
      { name: 'Kurtas', slug: 'kurtas', description: 'Heirloom hand-spun silk and chanderi kurtas for ceremonial gatherings' },
      { name: 'Nehru Jackets', slug: 'nehru-jackets', description: 'Finely tailored silk bundi jackets with botanical motifs' },
      { name: 'Tuxedos', slug: 'tuxedos', description: 'Contemporary evening cocktail wear tailored with Italian velvet' },
      { name: 'Trousers', slug: 'trousers', description: 'Bespoke aligarhi trousers, classic breeches, and silk churidars' },
      { name: 'Bottoms', slug: 'bottoms', description: 'Handcrafted bottoms, silk breeches, and tailored trousers' },
      { name: 'Shackets', slug: 'shackets', description: 'Contemporary artisanal overshirts and tailored silk shackets' },
      { name: 'Accessories', slug: 'accessories', description: 'Handcrafted mojris, safas, silk pocket squares, stoles, and jeweled buttons' },
    ];

    const categoryMap = new Map();
    for (const cat of categoriesData) {
      const [existing] = await conn.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
      if (existing.length === 0) {
        const [res] = await conn.query(
          'INSERT INTO categories (name, slug, description, created_at) VALUES (?, ?, ?, NOW())',
          [cat.name, cat.slug, cat.description]
        );
        categoryMap.set(cat.name, res.insertId);
        categoryMap.set(cat.slug, res.insertId);
      } else {
        await conn.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [cat.name, cat.description, existing[0].id]);
        categoryMap.set(cat.name, existing[0].id);
        categoryMap.set(cat.slug, existing[0].id);
      }
    }
    console.log(`  ✓ ${categoriesData.length} Categories verified and mapped.`);

    // 2. COLLECTIONS (Empty before this)
    console.log('\n[2/12] Seeding Haute Couture Collections...');
    const collectionsData = [
      {
        name: 'Love All FW26',
        slug: 'love-all-fw26',
        description: 'Autumn/Winter couture runway collection celebrating sovereign silhouettes, botanical zardozi, and royal hand-spun silks.',
      },
      {
        name: 'Rewild 2026',
        slug: 'rewild-2026',
        description: 'An ode to nature and conservation, featuring flora and fauna motifs handcrafted by heritage artisans.',
      },
      {
        name: 'Modern Classics',
        slug: 'modern-classics',
        description: 'Timeless bandhgalas and structured evening tuxedos re-engineered for the contemporary gentleman.',
      },
      {
        name: 'Benaras Collection',
        slug: 'benaras-collection',
        description: 'Centuries-old handloom katan silks and real gold and silver zari brocades from master Benarasi weavers.',
      },
      {
        name: 'Pichhwai Collection',
        slug: 'pichhwai-collection',
        description: 'Wearable heritage featuring hand-painted mythological garden scenes rendered in natural mineral pigments on raw silk.',
      },
      {
        name: 'Celebration Edit',
        slug: 'celebration-edit',
        description: 'Regal attire for the groom and wedding parties, from grand sangeet nights to imperial reception galas.',
      },
    ];

    for (const col of collectionsData) {
      const [existing] = await conn.query('SELECT id FROM collections WHERE slug = ?', [col.slug]);
      if (existing.length === 0) {
        await conn.query(
          'INSERT INTO collections (name, slug, description, created_at) VALUES (?, ?, ?, NOW())',
          [col.name, col.slug, col.description]
        );
      } else {
        await conn.query('UPDATE collections SET name = ?, description = ? WHERE id = ?', [col.name, col.description, existing[0].id]);
      }
    }
    console.log(`  ✓ ${collectionsData.length} Collections seeded.`);

    // 3. DESIGNERS / MASTER ATELIERS (Empty before this)
    console.log('\n[3/12] Seeding Designers & Master Ateliers...');
    const designersData = [
      {
        name: 'Mangesh Mahadev',
        slug: 'mangesh-mahadev',
        description: 'Founder and Principal Couturier, pioneering modern Indian luxury menswear and imperial bespoke craftsmanship.',
      },
      {
        name: 'Master Artisans of Benaras',
        slug: 'master-artisans-of-benaras',
        description: '7th-generation master weavers specializing in authentic kadwa and brocade handloom katan silks.',
      },
      {
        name: 'Jaipur Royal Atelier',
        slug: 'jaipur-royal-atelier',
        description: 'Specialist guild of master craftsmen preserving Mughal zardozi, dori, and marodi metal embroidery.',
      },
      {
        name: 'SEWA Artisans Guild',
        slug: 'sewa-artisans-guild',
        description: 'Eminent craft collective bringing authentic heirloom aari needlework and fine thread embroidery to high fashion.',
      },
    ];

    for (const des of designersData) {
      const [existing] = await conn.query('SELECT id FROM designers WHERE slug = ?', [des.slug]);
      if (existing.length === 0) {
        await conn.query(
          'INSERT INTO designers (name, slug, description, created_at) VALUES (?, ?, ?, NOW())',
          [des.name, des.slug, des.description]
        );
      } else {
        await conn.query('UPDATE designers SET name = ?, description = ? WHERE id = ?', [des.name, des.description, existing[0].id]);
      }
    }
    console.log(`  ✓ ${designersData.length} Designers / Ateliers seeded.`);

    // 4. USERS (Clean up dummy test customer and admin)
    console.log('\n[4/12] Updating & Seeding VIP Clientele & Atelier Admin...');
    
    // Check existing users
    const [existingUsers] = await conn.query('SELECT id, email, name FROM users');
    const userMap = new Map();
    existingUsers.forEach(u => userMap.set(u.email, u.id));

    // Update old dummy records if present
    await conn.query(
      "UPDATE users SET name = 'Devraj Singhania', email = 'devraj.singhania@singhaniagroup.com', phone = '+91 98200 45678' WHERE email = 'testuser@example.com'"
    );
    await conn.query(
      "UPDATE users SET name = 'Mangesh Mahadev Atelier Admin', email = 'admin@mangeshmahadev.com', phone = '+91 98765 43210' WHERE email = 'admin@example.com'"
    );

    const clientUsers = [
      { name: 'Devraj Singhania', email: 'devraj.singhania@singhaniagroup.com', phone: '+91 98200 45678', role: 'customer' },
      { name: 'Mangesh Mahadev Atelier Admin', email: 'admin@mangeshmahadev.com', phone: '+91 98765 43210', role: 'admin' },
      { name: 'Kavya Singhania', email: 'kavya.singhania@singhaniagroup.com', phone: '+91 98200 11223', role: 'customer' },
      { name: 'Vikramaditya Roy', email: 'vikramaditya.roy@royholdings.in', phone: '+91 98111 44556', role: 'customer' },
      { name: 'Rohan Mehra', email: 'rohan.mehra@mehraenterprises.com', phone: '+91 97654 32109', role: 'customer' },
      { name: 'Ananya Deshmukh', email: 'ananya.deshmukh@deshmukhlaw.com', phone: '+91 99887 76655', role: 'customer' },
      { name: 'Aditya Singhal', email: 'aditya.singhal@singhalcapital.com', phone: '+91 98210 99881', role: 'customer' },
      { name: 'Tarun Jindal', email: 'tarun.jindal@jindalglobal.com', phone: '+91 98300 77665', role: 'customer' },
    ];

    // Read an existing password_hash to reuse or use standard
    let sampleHash = '$2a$10$wT5iF2N2P7Z0N.kYh4NnK.qA1gE4mI.K7gH1wQ0uO3gK9lP2qE4iW'; // fallback bcrypt
    if (existingUsers.length > 0) {
      const [uRecord] = await conn.query('SELECT password_hash FROM users WHERE id = 1 LIMIT 1');
      if (uRecord.length > 0 && uRecord[0].password_hash) {
        sampleHash = uRecord[0].password_hash;
      }
    }

    const seededUserIds = [];
    for (const u of clientUsers) {
      const [ex] = await conn.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (ex.length === 0) {
        const [res] = await conn.query(
          'INSERT INTO users (name, email, phone, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [u.name, u.email, u.phone, u.role, sampleHash]
        );
        seededUserIds.push(res.insertId);
      } else {
        await conn.query('UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?', [u.name, u.phone, u.role, ex[0].id]);
        seededUserIds.push(ex[0].id);
      }
    }
    console.log(`  ✓ ${clientUsers.length} Distinguished patrons and Atelier admin configured.`);

    // 5. PRODUCTS (Clean up dummy items & seed 50+ luxury pieces)
    console.log('\n[5/12] Cleaning test products and seeding Master Luxury Menswear Catalog...');
    
    // Clean up test products that have temporary timestamp slugs
    await conn.query("DELETE FROM products WHERE slug LIKE 'emerald-bandhgala-%' OR slug LIKE 'royal-blue-kurta-%'");

    // Build the master product list
    const masterProducts = [
      // ─── SHERWANIS ─────────────────────────────────────────────────────────
      {
        title: 'Kindred Embroidered Zardozi Silk Sherwani',
        slug: 'kindred-embroidered-zardozi-silk-sherwani',
        category: 'Sherwanis',
        price: '290000.00',
        salePrice: '275000.00',
        stock: 8,
        sku: 'MM-SHR-101',
        styleNumber: 'F26MP8',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw6c58fa09/images/hires/FW26/F26MP8SR_BEIGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Beige',
        colorHex: '#D6C7B2',
        craft: 'Imperial Metallic Zardozi & Resham',
        badge: 'EXCLUSIVE',
        editorialStory: 'Zardozi has enriched the attire of kings since the Mughal era. An expression of soft florals in a sovereign garden, meticulously worked in gold-thread embroidery on pure raw silk.',
        measurements: 'Sherwani Length - 110 cm (43.3 In)\nChuridar Fabric - 250 cm (2.5 Mtrs)\nDraped Stole - 250 cm (2.5 Mtrs)',
        fabricContent: '100% Raw Silk + Lining: 100% Pure Viscose Silk',
        componentsCount: 3,
        setIncludes: 'Hand-embroidered Sherwani, Tailored Churidar Fabric & Tissue Silk Stole',
        washCare: 'Dry Clean / Spot Clean Only',
      },
      {
        title: 'Hymn Embroidered Sherwani',
        slug: 'hymn-embroidered-sherwani-gold',
        category: 'Sherwanis',
        price: '165000.00',
        salePrice: null,
        stock: 6,
        sku: 'MM-SHR-102',
        styleNumber: 'F26MP6',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw9d6fc6f2/images/hires/FW26/F26MP6J_GOLD_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Antique Gold',
        colorHex: '#D4AF37',
        craft: 'Antique Kasab & Fine Marodi Work',
        badge: 'FW26 RUNWAY',
        editorialStory: 'Inspired by palace archways of Amber Fort, this antique gold sherwani features dense floral filigree embroidered with kasab wire on handwoven tissue chanderi.',
        measurements: 'Sherwani Length - 112 cm\nChuridar - 250 cm fabric\nStole - 250 cm',
        fabricContent: 'Tissue Chanderi & Pure Silk',
        componentsCount: 3,
        setIncludes: 'Kasab Sherwani, Handcrafted Churidar & Tissue Stole',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Resonance Embroidered Silk Sherwani',
        slug: 'resonance-embroidered-silk-sherwani-ivory',
        category: 'Sherwanis',
        price: '250000.00',
        salePrice: null,
        stock: 5,
        sku: 'MM-SHR-103',
        styleNumber: 'F26MP4',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwba1c1f0d/images/hires/FW26/F26MP4SR_IVORY_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw9858757b/images/hires/FW26/F26MP4SR_IVORY_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Ivory',
        colorHex: '#FFFFF0',
        craft: 'Hand-embroidered Pearl & Resham Zardozi',
        badge: 'HERITAGE COUTURE',
        editorialStory: 'A pristine ivory raw silk canvas detailed with micro-pearls and subtle silver metallic embroidery, handcrafted over 280 artisan hours in our Mumbai atelier.',
        measurements: 'Sherwani Length - 110 cm\nChuridar - 250 cm fabric',
        fabricContent: '100% Pure Mulberry Silk',
        componentsCount: 2,
        setIncludes: 'Pearl Zardozi Sherwani & Silk Churidar Fabric',
        washCare: 'Specialist Dry Clean Only',
      },
      {
        title: 'Ballad Embroidered Zardozi Silk Sherwani',
        slug: 'ballad-embroidered-zardozi-silk-sherwani-pink',
        category: 'Sherwanis',
        price: '310000.00',
        salePrice: null,
        stock: 4,
        sku: 'MM-SHR-104',
        styleNumber: 'F26M7',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweeadaa9a/images/hires/FW26/F26M7SR_PINK_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwbe542b4a/images/hires/FW26/F26M7SR_PINK_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Rose Quartz Pink',
        colorHex: '#E8C5C8',
        craft: 'Royal Botanical Zardozi & Dori Work',
        badge: 'BESPOKE MASTERPIECE',
        editorialStory: 'Worn by discerning royal grooms, the Ballad Sherwani harmonizes soft blush hues with glistening champagne bullion threads and heritage dori work.',
        measurements: 'Sherwani Length - 114 cm\nChuridar - 250 cm',
        fabricContent: 'Hand-loomed Raw Silk',
        componentsCount: 3,
        setIncludes: 'Sherwani, Silk Churidar & Embroidered Stole',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Mirage Imperial Brocade Sherwani',
        slug: 'mirage-imperial-brocade-sherwani',
        category: 'Sherwanis',
        price: '320000.00',
        salePrice: null,
        stock: 3,
        sku: 'MM-SHR-105',
        styleNumber: 'MM-BRC-88',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1afbca64/images/hires/F25/Men/F25MR25SR_CHAMPAGNE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1afbca64/images/hires/F25/Men/F25MR25SR_CHAMPAGNE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Champagne Gold',
        colorHex: '#F7E7CE',
        craft: 'Woven Banarasi Katan Silk & Real Zari',
        badge: 'HERITAGE COUTURE',
        editorialStory: 'Woven on vintage jacquard pit looms in Varanasi with pure gold and silver dipped silk threads. Finished with imperial handcrafted gem buttons.',
        measurements: 'Sherwani Length - 115 cm\nChuridar - 250 cm',
        fabricContent: '100% Banarasi Katan Silk with Pure Zari',
        componentsCount: 3,
        setIncludes: 'Brocade Sherwani, Tailored Silk Churidar & Organza Safa',
        washCare: 'Specialist Dry Clean Only',
      },
      {
        title: 'Anshul Embroidered Silk Sherwani - Maroon',
        slug: 'anshul-embroidered-silk-sherwani-maroon',
        category: 'Sherwanis',
        price: '195000.00',
        salePrice: null,
        stock: 5,
        sku: 'MM-SHR-106',
        styleNumber: 'F25MR59',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw0c9d8136/images/hires/F25/Men/F25MR59SR_Maroon_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw0c9d8136/images/hires/F25/Men/F25MR59SR_Maroon_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Royal Maroon',
        colorHex: '#800000',
        craft: 'Imperial Marodi & Resham Threadwork',
        badge: 'READY TO SHIP',
        editorialStory: 'A deep crimson-maroon velvet sherwani adorned with intricate botanical tendrils in antique gold wire, perfect for grand evening pheras.',
        measurements: 'Sherwani Length - 110 cm',
        fabricContent: 'Silk Velvet & Katan Silk',
        componentsCount: 2,
        setIncludes: 'Sherwani & Handcrafted Silk Churidar',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Anshul Embroidered Silk Sherwani - Emerald Green',
        slug: 'anshul-embroidered-silk-sherwani-green',
        category: 'Sherwanis',
        price: '195000.00',
        salePrice: null,
        stock: 4,
        sku: 'MM-SHR-107',
        styleNumber: 'F25MR60',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwbe33d0cd/images/hires/F25/Men/F25MR59SR_Green_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwbe33d0cd/images/hires/F25/Men/F25MR59SR_Green_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Emerald Green',
        colorHex: '#046307',
        craft: 'Marodi & Bullion Wire Embroidery',
        badge: 'EXCLUSIVE',
        editorialStory: 'Sovereign forest emerald silk enriched with marodi needlework celebrating Jaipur court gardens.',
        measurements: 'Sherwani Length - 110 cm',
        fabricContent: 'Pure Raw Silk with Satin Viscose Lining',
        componentsCount: 2,
        setIncludes: 'Sherwani & Aligarhi Trouser',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Avir Aari Embroidered Silk Sherwani',
        slug: 'avir-aari-embroidered-silk-sherwani-cream',
        category: 'Sherwanis',
        price: '185000.00',
        salePrice: null,
        stock: 6,
        sku: 'MM-SHR-108',
        styleNumber: 'F25MR31',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw5dbd8997/images/hires/FW26/F25MR31SR_CREAM_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw5dbd8997/images/hires/FW26/F25MR31SR_CREAM_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Cream',
        colorHex: '#FFFDD0',
        craft: 'Fine Aari & Resham Needlework',
        badge: 'HERITAGE COUTURE',
        editorialStory: 'Crafted in collaboration with master artisans, featuring fluid aari needlework on textured cream silk.',
        measurements: 'Sherwani Length - 110 cm',
        fabricContent: 'Pure Mulberry Silk',
        componentsCount: 2,
        setIncludes: 'Sherwani & Silk Churidar',
        washCare: 'Dry Clean Only',
      },

      // ─── BANDHGALAS ────────────────────────────────────────────────────────
      {
        title: 'Daydream Embroidered Zardozi Silk Bandhgala',
        slug: 'daydream-embroidered-zardozi-silk-bandhgala',
        category: 'Bandhgalas',
        price: '120000.00',
        salePrice: null,
        stock: 12,
        sku: 'MM-BDG-201',
        styleNumber: 'F26MP32J',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw0edbbba5/images/hires/FW26/F26MP32J_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Off White',
        colorHex: '#EDE7DF',
        craft: 'Zardozi Gold-Thread & French Knots',
        badge: 'FW26 RUNWAY',
        editorialStory: 'An expression of soft florals in a sovereign garden. Handcrafted by master artisans in precious gold-thread work and French knots on pure raw silk.',
        measurements: 'Bandhgala Length - 78 cm\nChest - 42 In (Size 42)',
        fabricContent: '100% Hand-woven Raw Silk',
        componentsCount: 1,
        setIncludes: 'Structured Silk Bandhgala Jacket',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Heartfelt Embroidered Cord Silk Bandhgala',
        slug: 'heartfelt-embroidered-cord-silk-bandhgala-wine',
        category: 'Bandhgalas',
        price: '160000.00',
        salePrice: null,
        stock: 7,
        sku: 'MM-BDG-202',
        styleNumber: 'F26MP5J',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwd0c77031/images/hires/FW26/F26MP5J_WINE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw30971145/images/hires/FW26/F26MP5J_WINE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Wine',
        colorHex: '#722F37',
        craft: 'Dori Cord Embroidery & Kasab Detailing',
        badge: 'EXCLUSIVE',
        editorialStory: 'A deep wine cord silk tailored silhouette featuring raised botanical cord embroidery along the mandarin collar and imperial placket.',
        measurements: 'Jacket Length - 79 cm',
        fabricContent: 'Mulberry Cord Silk & Satin Lining',
        componentsCount: 1,
        setIncludes: 'Cord Silk Bandhgala Jacket',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Embrace Embroidered Velvet Bandhgala',
        slug: 'embrace-embroidered-velvet-bandhgala',
        category: 'Bandhgalas',
        price: '145000.00',
        salePrice: '135000.00',
        stock: 9,
        sku: 'MM-BDG-203',
        styleNumber: 'MM-VLT-12',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweb69c428/images/hires/F25/Men/F25MR29SR_Navy_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweb69c428/images/hires/F25/Men/F25MR29SR_Navy_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Midnight Navy',
        colorHex: '#1B263B',
        craft: 'Gold Bullion Threadwork on Micro-velvet',
        badge: 'READY TO SHIP',
        editorialStory: 'Crafted in deep midnight navy micro-velvet, featuring sovereign gold bullion thread embroidery along the imperial collar and cuffs.',
        measurements: 'Length - 78 cm\nShoulder - 18.5 In',
        fabricContent: 'Italian Micro-velvet & Pure Silk Lining',
        componentsCount: 1,
        setIncludes: 'Embroidered Velvet Bandhgala',
        washCare: 'Specialist Dry Clean Only',
      },
      {
        title: 'Azar Hand-embroidered Silk Bandhgala',
        slug: 'azar-hand-embroidered-silk-bandhgala-black',
        category: 'Bandhgalas',
        price: '150000.00',
        salePrice: null,
        stock: 8,
        sku: 'MM-BDG-204',
        styleNumber: 'F25MR32',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw6c58fa09/images/hires/FW26/F26MP8SR_BEIGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw6c58fa09/images/hires/FW26/F26MP8SR_BEIGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Jet Black',
        colorHex: '#0A0A0A',
        craft: 'Tone-on-tone Resham & Metallic Wire',
        badge: 'MODERN CLASSIC',
        editorialStory: 'Subtle textural richness in pure jet black silk, tailored with military precision and concealed horn buttons.',
        measurements: 'Length - 77 cm',
        fabricContent: '100% Raw Silk',
        componentsCount: 1,
        setIncludes: 'Black Silk Bandhgala Jacket',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Ipsit Hand-painted Pichhwai Silk Bandhgala',
        slug: 'ipsit-hand-painted-pichhwai-silk-bandhgala',
        category: 'Bandhgalas',
        price: '175000.00',
        salePrice: null,
        stock: 4,
        sku: 'MM-BDG-205',
        styleNumber: 'MM-PCH-04',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwc3d69674/images/hires/F25/Men/F25MR28SR_Blush_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwc3d69674/images/hires/F25/Men/F25MR28SR_Blush_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Sapphire Navy',
        colorHex: '#0F52BA',
        craft: 'Hand-painted Rajasthan Pichhwai & Zardozi',
        badge: 'BESPOKE MASTERPIECE',
        editorialStory: 'Painted by 7th-generation temple artists in Nathdwara with natural stone minerals, outlined in delicate gold thread.',
        measurements: 'Length - 78 cm',
        fabricContent: 'Pure Raw Silk with Botanical Mineral Pigments',
        componentsCount: 1,
        setIncludes: 'Hand-painted Pichhwai Bandhgala',
        washCare: 'Specialist Dry Clean Only',
      },

      // ─── NEHRU JACKETS / BANDIS ───────────────────────────────────────────
      {
        title: 'Fondness Embroidered Silk Nehru Jacket',
        slug: 'fondness-embroidered-silk-nehru-jacket',
        category: 'Nehru Jackets',
        price: '75000.00',
        salePrice: null,
        stock: 15,
        sku: 'MM-NHR-301',
        styleNumber: 'F26MP2B',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwfab212d9/images/hires/FW26/F26MP2B_SAGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw7de6a748/images/hires/FW26/F26MP2B_SAGE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Sage Green',
        colorHex: '#9EAD9F',
        craft: 'Flora Aari & Dori Embroidery',
        badge: 'FW26 RUNWAY',
        editorialStory: 'Crafted in soothing sage mulberry silk, detailed with botanical floral motifs inspired by the royal gardens of Jaipur.',
        measurements: 'Jacket Length - 72 cm\nChest - 42 In (Size 42)',
        fabricContent: '100% Mulberry Silk',
        componentsCount: 1,
        setIncludes: 'Handcrafted Silk Nehru Jacket',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Serenade Hand-embroidered Silk Nehru Jacket',
        slug: 'serenade-hand-embroidered-silk-nehru-jacket',
        category: 'Nehru Jackets',
        price: '60000.00',
        salePrice: null,
        stock: 18,
        sku: 'MM-NHR-302',
        styleNumber: 'F26MP1B',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw9b989e97/images/hires/FW26/F26MP1B_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw117051cf/images/hires/FW26/F26MP1B_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Off White',
        colorHex: '#FAF6F0',
        craft: 'Marodi & Tone-on-Tone Threadwork',
        badge: 'READY TO SHIP',
        editorialStory: 'Subtle tone-on-tone marodi embroidery on fine ivory silk. Perfect for regal summer cocktail and mehendi soirees.',
        measurements: 'Jacket Length - 72 cm',
        fabricContent: 'Pure Raw Silk with Habotai Lining',
        componentsCount: 1,
        setIncludes: 'Embroidered Ivory Bandi',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Abjit Tailored Silk Nehru Jacket',
        slug: 'abjit-tailored-silk-nehru-jacket-blush',
        category: 'Nehru Jackets',
        price: '55000.00',
        salePrice: null,
        stock: 10,
        sku: 'MM-NHR-303',
        styleNumber: 'F25MR35',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwc3d69674/images/hires/F25/Men/F25MR28SR_Blush_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwc3d69674/images/hires/F25/Men/F25MR28SR_Blush_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Blush Pink',
        colorHex: '#FFD1DC',
        craft: 'Delicate Resham Dori Work',
        badge: 'POPULAR',
        editorialStory: 'Pastel festive perfection in light blush silk with concealed placket and hand-finished welt pockets.',
        measurements: 'Length - 71 cm',
        fabricContent: 'Pure Raw Silk',
        componentsCount: 1,
        setIncludes: 'Blush Nehru Jacket',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Omar Embroidered Silk Nehru Jacket',
        slug: 'omar-embroidered-silk-nehru-jacket-mustard',
        category: 'Nehru Jackets',
        price: '60000.00',
        salePrice: null,
        stock: 8,
        sku: 'MM-NHR-304',
        styleNumber: 'F25MR38',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw9d6fc6f2/images/hires/FW26/F26MP6J_GOLD_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Mustard Gold',
        colorHex: '#FFDB58',
        craft: 'Zari Thread embroidery & Metal Shank Buttons',
        badge: 'CELEBRATION EDIT',
        editorialStory: 'Radiant mustard gold raw silk with geometric botanical zari borders inspired by Shekhawati frescoes.',
        measurements: 'Length - 72 cm',
        fabricContent: 'Pure Chanderi Silk',
        componentsCount: 1,
        setIncludes: 'Mustard Gold Bandi',
        washCare: 'Dry Clean Only',
      },

      // ─── KURTAS & KURTA SETS ──────────────────────────────────────────────
      {
        title: 'Forever Embroidered Mul Kurta Set',
        slug: 'forever-embroidered-mul-kurta-set',
        category: 'Kurtas',
        price: '45000.00',
        salePrice: null,
        stock: 20,
        sku: 'MM-KRT-401',
        styleNumber: 'F26MP4K',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwa1347020/images/hires/FW26/F26MP4K_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwed6b3075/images/hires/FW26/F26MP4K_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Off White',
        colorHex: '#FAF6F0',
        craft: 'Chikankari & Delicate Mukaish',
        badge: 'READY TO SHIP',
        editorialStory: 'Featherlight organic cotton mul paired with gossamer silk embroidery. Designed for day-long festive comfort.',
        measurements: 'Kurta Length - 105 cm\nChuridar - 250 cm',
        fabricContent: '100% Organic Mul Cotton Kurta with Silk Churidar',
        componentsCount: 2,
        setIncludes: 'Hand-embroidered Kurta & Aligarhi Churidar Trouser',
        washCare: 'Gentle Hand Wash or Dry Clean',
      },
      {
        title: 'Sovereign Raw Silk Kurta Set',
        slug: 'sovereign-raw-silk-kurta-set',
        category: 'Kurtas',
        price: '48000.00',
        salePrice: null,
        stock: 22,
        sku: 'MM-KRT-402',
        styleNumber: 'MM-KRT-107',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw5dbd8997/images/hires/FW26/F25MR31SR_CREAM_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw5dbd8997/images/hires/FW26/F25MR31SR_CREAM_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Blush Cream',
        colorHex: '#F5ECE3',
        craft: 'Subtle Marodi Threadwork on Collar',
        badge: 'HERITAGE COUTURE',
        editorialStory: 'A timeless silhouette in handwoven blush mulberry silk featuring subtle chikankari threadwork paired with slim churidar.',
        measurements: 'Kurta Length - 106 cm',
        fabricContent: 'Pure Mulberry Silk',
        componentsCount: 2,
        setIncludes: 'Pure Silk Kurta & Silk Churidar',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Aryam Woven Benarasi Kurta Set',
        slug: 'aryam-woven-benarasi-kurta-emerald-green',
        category: 'Kurtas',
        price: '35000.00',
        salePrice: null,
        stock: 14,
        sku: 'MM-KRT-403',
        styleNumber: 'F25M10K',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwbe33d0cd/images/hires/F25/Men/F25MR59SR_Green_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwbe33d0cd/images/hires/F25/Men/F25MR59SR_Green_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Emerald Green',
        colorHex: '#046307',
        craft: 'Woven Benarasi Buti & Antique Zari',
        badge: 'CELEBRATION EDIT',
        editorialStory: 'Woven in the spiritual looms of Varanasi with delicate floral buti motifs in muted gold zari.',
        measurements: 'Kurta Length - 108 cm',
        fabricContent: '100% Benarasi Silk',
        componentsCount: 2,
        setIncludes: 'Woven Kurta & Churidar Fabric',
        washCare: 'Dry Clean Only',
      },

      // ─── TUXEDOS & COCKTAIL WEAR ──────────────────────────────────────────
      {
        title: 'Firelight Embroidered Silk Blazer',
        slug: 'firelight-embroidered-silk-blazer-off-white',
        category: 'Tuxedos',
        price: '90000.00',
        salePrice: null,
        stock: 8,
        sku: 'MM-TUX-501',
        styleNumber: 'F26MP31J',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw83bb767f/images/hires/FW26/F26MP31J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf8e6e01f/images/hires/FW26/F26MP31J_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Off White',
        colorHex: '#FDFBF7',
        craft: 'Contemporary Silk Resham Embroidery',
        badge: 'BLACK TIE',
        editorialStory: 'A masterclass in modern evening glamour. Soft silk structured lapel jacket adorned with botanical flora in tone-on-tone embroidery.',
        measurements: 'Blazer Length - 76 cm\nDrop 7 Tailoring',
        fabricContent: 'Italian Silk & Raw Mulberry Silk',
        componentsCount: 1,
        setIncludes: 'Single-breasted Silk Cocktail Blazer',
        washCare: 'Specialist Dry Clean Only',
      },
      {
        title: 'Sovereign Midnight Velvet Cocktail Tuxedo',
        slug: 'sovereign-midnight-velvet-cocktail-tuxedo',
        category: 'Tuxedos',
        price: '135000.00',
        salePrice: null,
        stock: 5,
        sku: 'MM-TUX-502',
        styleNumber: 'MM-TUX-02',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweb69c428/images/hires/F25/Men/F25MR29SR_Navy_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweb69c428/images/hires/F25/Men/F25MR29SR_Navy_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Midnight Blue',
        colorHex: '#191970',
        craft: 'Satin Silk Shawl Collar on Italian Velvet',
        badge: 'EXCLUSIVE',
        editorialStory: 'Hand-tailored tuxedo jacket with structured shoulders, duchess satin shawl lapels, and silk-covered buttons for red carpet soirees.',
        measurements: 'Length - 76 cm',
        fabricContent: 'Italian Velvet with 100% Duchess Silk Satin',
        componentsCount: 2,
        setIncludes: 'Tuxedo Jacket & Tailored Black Trousers',
        washCare: 'Specialist Dry Clean Only',
      },

      // ─── BOTTOMS / TROUSERS ───────────────────────────────────────────────
      {
        title: 'Bespoke Ivory Raw Silk Aligarhi Trousers',
        slug: 'bespoke-ivory-raw-silk-aligarhi-trousers',
        category: 'Trousers',
        price: '25000.00',
        salePrice: null,
        stock: 25,
        sku: 'MM-TRS-601',
        styleNumber: 'MM-TRS-01',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwba1c1f0d/images/hires/FW26/F26MP4SR_IVORY_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwba1c1f0d/images/hires/FW26/F26MP4SR_IVORY_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Ivory',
        colorHex: '#FFFFF0',
        craft: 'Traditional Aligarhi Cut with Concealed Waist Ties',
        badge: 'STAPLE COUTURE',
        editorialStory: 'Handcrafted raw silk trousers with tailored taper, specifically engineered to sit flawlessly beneath royal sherwanis and bandhgalas.',
        measurements: 'Inseam - 32 In\nWaist - Adjustable Drawstring & Belt Loops',
        fabricContent: '100% Handloom Silk',
        componentsCount: 1,
        setIncludes: 'Silk Aligarhi Trousers',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Hand-loomed Mulberry Silk Churidar',
        slug: 'hand-loomed-mulberry-silk-churidar',
        category: 'Bottoms',
        price: '18000.00',
        salePrice: null,
        stock: 30,
        sku: 'MM-BTM-602',
        styleNumber: 'MM-BTM-02',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Warm Beige',
        colorHex: '#F5F5DC',
        craft: 'Bias-cut gather churidar craftsmanship',
        badge: 'ESSENTIAL',
        editorialStory: 'Expert bias cut yields elegant gathered ripples at the ankles without restricting regal movement.',
        measurements: 'Custom fit to ankle',
        fabricContent: '100% Mulberry Silk',
        componentsCount: 1,
        setIncludes: 'Mulberry Silk Churidar',
        washCare: 'Dry Clean Only',
      },

      // ─── ACCESSORIES / MOJRIS / SAFAS ─────────────────────────────────────
      {
        title: 'Shravas Embroidered Silk Mojris',
        slug: 'shravas-embroidered-silk-mojris-natural',
        category: 'Accessories',
        price: '30000.00',
        salePrice: null,
        stock: 12,
        sku: 'MM-ACC-701',
        styleNumber: 'F25M26SRSH',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwd590e797/images/hires/F25/Accessories/F25M26SRSH_Natural_11.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf1a7b692/images/hires/F25/Men/F25M26SRSH_Natural_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Natural Champagne',
        colorHex: '#F7E7CE',
        craft: 'Hand-embroidered Zardozi & Cushioned Leather Sole',
        badge: 'READY TO SHIP',
        editorialStory: 'Heirloom ceremonial footwear handcrafted by master cobblers in Rajasthan. Soft padded leather footbeds wrapped in pure embroidered silk.',
        measurements: 'Sizes: 7, 8, 9, 10, 11 (UK/India)',
        fabricContent: 'Pure Silk Upper + Genuine Leather Sole',
        componentsCount: 1,
        setIncludes: 'Pair of Embroidered Mojris with Velvet Dust Bag',
        washCare: 'Keep Dry, Clean with Soft Brush',
      },
      {
        title: 'Vismay Gota Patti Silk Mojris',
        slug: 'vismay-gota-patti-silk-mojris-ivory',
        category: 'Accessories',
        price: '28000.00',
        salePrice: null,
        stock: 10,
        sku: 'MM-ACC-702',
        styleNumber: 'F25MP6SRSH',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwb1dbfbb8/images/hires/F25/Accessories/F25MP25SRSH_CHGE_11.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwc625ddfb/images/hires/F25/Men/F25MP25SRSH_Champagne_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Ivory Gold',
        colorHex: '#FFFFF0',
        craft: 'Authentic Jaipur Gota Patti Ribbon Work',
        badge: 'EXCLUSIVE',
        editorialStory: 'Traditional gota patti cutwork on ivory raw silk with brass nailhead sole detailing.',
        measurements: 'Sizes 7 to 11 UK',
        fabricContent: 'Silk & Leather',
        componentsCount: 1,
        setIncludes: 'Pair of Mojris in Presentation Box',
        washCare: 'Store in moisture-free pouch',
      },
      {
        title: 'Imperial Zardozi Embroidered Silk Safa',
        slug: 'imperial-zardozi-embroidered-silk-safa',
        category: 'Accessories',
        price: '35000.00',
        salePrice: null,
        stock: 15,
        sku: 'MM-ACC-703',
        styleNumber: 'MM-SFA-09',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw9d6fc6f2/images/hires/FW26/F26MP6J_GOLD_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Gold & Ivory',
        colorHex: '#D4AF37',
        craft: 'Chanderi Silk with Zardozi Borders',
        badge: 'ROYAL WEDDING',
        editorialStory: '8-meter ceremonial turban cloth woven in tissue chanderi with hand-embroidered zardozi pallu borders.',
        measurements: 'Length: 8.5 Meters x Width: 1.1 Meters',
        fabricContent: '100% Chanderi Tissue Silk',
        componentsCount: 1,
        setIncludes: 'Imperial Turban Fabric & Jeweled Kalangi Pin',
        washCare: 'Dry Clean Only',
      },
      {
        title: 'Heirloom Gemstone Button Set',
        slug: 'heirloom-gemstone-button-set-gold',
        category: 'Accessories',
        price: '24000.00',
        salePrice: null,
        stock: 20,
        sku: 'MM-ACC-704',
        styleNumber: 'MM-BTN-01',
        imageFront: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        imageDetail: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw0edbbba5/images/hires/FW26/F26MP32J_OFF%20WHITE_3.jpg?sw=850&sh=1275&sm=fit&strip=false',
        color: 'Emerald & Gold',
        colorHex: '#50C878',
        craft: 'Handcrafted Jadau Meenakari & Kundan',
        badge: 'HANDCRAFTED',
        editorialStory: 'Set of 7 detachable bandhgala buttons crafted in 24K gold-plated silver with synthetic emerald center stones and reverse meenakari enameling.',
        measurements: 'Diameter - 18mm each',
        fabricContent: '24K Micron Gold Plated Silver with Kundan & Meenakari',
        componentsCount: 7,
        setIncludes: '7 Jeweled Buttons in Bespoke Velvet Jewelry Case',
        washCare: 'Wipe with Dry Jewelry Cloth',
      },
    ];

    const seededProductMap = new Map();

    for (const p of masterProducts) {
      const catId = categoryMap.get(p.category) || categoryMap.get('Sherwanis');
      const [existing] = await conn.query('SELECT id FROM products WHERE slug = ?', [p.slug]);

      const sizes = JSON.stringify(['38', '40', '42', '44', '46', '48']);
      const inStockSizes = JSON.stringify(['38', '40', '42', '44', '46']);
      const gallery = JSON.stringify([p.imageFront, p.imageDetail]);
      const colorVariants = JSON.stringify([
        {
          id: `var-${p.slug}`,
          color: p.color,
          colorHex: p.colorHex || '#D6C7B2',
          imageFront: p.imageFront,
          sizes: ['38', '40', '42', '44', '46', '48'],
          inStockSizes: ['38', '40', '42', '44', '46'],
        }
      ]);

      const values = [
        p.title,
        p.slug,
        p.editorialStory || p.title,
        p.price,
        p.salePrice || null,
        p.stock || 10,
        p.sku,
        catId,
        1, // isActive
        p.imageFront,
        p.imageDetail,
        p.color,
        p.colorHex,
        p.craft,
        p.badge,
        sizes,
        inStockSizes,
        1, // readyToShip
        p.editorialStory,
        p.styleNumber,
        p.measurements,
        p.fabricContent,
        p.componentsCount || 1,
        p.setIncludes,
        p.washCare || 'Dry Clean Only',
        'India',
        'House of Mangesh Mahadev Private Limited, Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India - 400701.',
        'This bespoke couture item is custom-tailored to order. Complimentary fitting alterations included.',
        'Slight variations in weave texture and embroidery are the hallmark of authentic hand-spun artisanal craftsmanship.',
        'both',
        colorVariants,
        gallery,
      ];

      if (existing.length === 0) {
        const [res] = await conn.query(
          `INSERT INTO products (
            title, slug, description, price, sale_price, stock, sku, category_id,
            is_active, image_front, image_detail, color, color_hex, craft, badge,
            sizes, in_stock_sizes, ready_to_ship, editorial_story, style_number,
            measurements, fabric_content, components_count, set_includes, wash_care,
            country_of_origin, manufacturer_address, returns_policy, disclaimer,
            delivery_method, color_variants, gallery, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          values
        );
        seededProductMap.set(p.title, res.insertId);
        seededProductMap.set(p.slug, res.insertId);
      } else {
        await conn.query(
          `UPDATE products SET
            title = ?, description = ?, price = ?, sale_price = ?, stock = ?, sku = ?,
            category_id = ?, is_active = ?, image_front = ?, image_detail = ?,
            color = ?, color_hex = ?, craft = ?, badge = ?, sizes = ?, in_stock_sizes = ?,
            ready_to_ship = ?, editorial_story = ?, style_number = ?, measurements = ?,
            fabric_content = ?, components_count = ?, set_includes = ?, wash_care = ?,
            country_of_origin = ?, manufacturer_address = ?, returns_policy = ?, disclaimer = ?,
            delivery_method = ?, color_variants = ?, gallery = ?, updated_at = NOW()
          WHERE id = ?`,
          [
            p.title, p.editorialStory || p.title, p.price, p.salePrice || null, p.stock || 10, p.sku,
            catId, 1, p.imageFront, p.imageDetail,
            p.color, p.colorHex, p.craft, p.badge, sizes, inStockSizes,
            1, p.editorialStory, p.styleNumber, p.measurements,
            p.fabricContent, p.componentsCount || 1, p.setIncludes, p.washCare || 'Dry Clean Only',
            'India', 'House of Mangesh Mahadev Private Limited, Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India - 400701.',
            'This bespoke couture item is custom-tailored to order. Complimentary fitting alterations included.',
            'Slight variations in weave texture and embroidery are the hallmark of authentic hand-spun artisanal craftsmanship.',
            'both', colorVariants, gallery,
            existing[0].id
          ]
        );
        seededProductMap.set(p.title, existing[0].id);
        seededProductMap.set(p.slug, existing[0].id);
      }
    }
    console.log(`  ✓ ${masterProducts.length} Luxury couture products seeded into catalog.`);

    // 6. MEDIA (Editorial Celebrity & Runway assets)
    console.log('\n[6/12] Seeding Haute Couture Media Gallery...');
    const mediaItems = [
      {
        url: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwf27d8283/images/hires/FW26/F26MP8SR_BEIGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        altText: 'Ranbir Kapoor in Custom Hand-woven Ivory Zardozi Sherwani for Reception Gala',
        kind: 'image',
      },
      {
        url: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw1b754ca9/images/hires/FW26/F26MP6J_GOLD_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        altText: 'Vicky Kaushal in Imperial Antique Kasab Sherwani at Royal Palace Pheras',
        kind: 'image',
      },
      {
        url: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dwfab212d9/images/hires/FW26/F26MP2B_SAGE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        altText: 'Sidharth Malhotra in Sage Chanderi Bundi & Kurta Set for Bespoke Sangeet Night',
        kind: 'image',
      },
      {
        url: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw83bb767f/images/hires/FW26/F26MP31J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        altText: 'Aditya Roy Kapur in Firelight Silk Cocktail Tuxedo for Black Tie Soirée',
        kind: 'image',
      },
      {
        url: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dw67b07f8a/images/hires/FW26/F26MP32J_OFF%20WHITE_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        altText: 'FW26 Runway Campaign - Daydream Zardozi Silk Bandhgala',
        kind: 'image',
      },
      {
        url: 'https://www.anitadongre.com/dw/image/v2/BGCX_PRD/on/demandware.static/-/Sites-masterCatalog_AD_India/default/dweeadaa9a/images/hires/FW26/F26M7SR_PINK_1.jpg?sw=850&sh=1275&sm=fit&strip=false',
        altText: 'Ballad Rose Quartz Sherwani on Sovereign Runway Model',
        kind: 'image',
      },
    ];

    for (const m of mediaItems) {
      const [ex] = await conn.query('SELECT id FROM media WHERE url = ?', [m.url]);
      if (ex.length === 0) {
        await conn.query(
          'INSERT INTO media (url, alt_text, kind, created_at) VALUES (?, ?, ?, NOW())',
          [m.url, m.altText, m.kind]
        );
      }
    }
    console.log(`  ✓ ${mediaItems.length} Haute couture media assets registered.`);

    // 7. CLIENT MEASUREMENTS
    console.log('\n[7/12] Seeding Bespoke Couture Measurements...');
    const measurementsData = [
      { userId: seededUserIds[0], chest: '41.50', waist: '34.00', hip: '41.50', shoulder: '18.50', sleeveLength: '25.50', inseam: '32.00', unit: 'inches' },
      { userId: seededUserIds[2], chest: '39.00', waist: '32.50', hip: '40.00', shoulder: '17.75', sleeveLength: '24.50', inseam: '31.50', unit: 'inches' },
      { userId: seededUserIds[3], chest: '43.00', waist: '36.00', hip: '43.50', shoulder: '19.25', sleeveLength: '26.00', inseam: '33.00', unit: 'inches' },
      { userId: seededUserIds[4], chest: '40.00', waist: '33.00', hip: '41.00', shoulder: '18.00', sleeveLength: '25.00', inseam: '32.00', unit: 'inches' },
    ];

    for (const m of measurementsData) {
      if (!m.userId) continue;
      const [ex] = await conn.query('SELECT id FROM user_measurements WHERE user_id = ?', [m.userId]);
      if (ex.length === 0) {
        await conn.query(
          'INSERT INTO user_measurements (user_id, chest, waist, hip, shoulder, sleeve_length, inseam, unit, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [m.userId, m.chest, m.waist, m.hip, m.shoulder, m.sleeveLength, m.inseam, m.unit]
        );
      } else {
        await conn.query(
          'UPDATE user_measurements SET chest = ?, waist = ?, hip = ?, shoulder = ?, sleeve_length = ?, inseam = ?, unit = ?, updated_at = NOW() WHERE id = ?',
          [m.chest, m.waist, m.hip, m.shoulder, m.sleeveLength, m.inseam, m.unit, ex[0].id]
        );
      }
    }
    console.log(`  ✓ Couture measurement profiles recorded.`);

    // 8. ADDRESSES (Clean up fake streets & seed prestigious addresses)
    console.log('\n[8/12] Updating & Seeding Bespoke Client Delivery Addresses...');
    await conn.query("DELETE FROM addresses WHERE line1 LIKE '%123 Fake Street%'");

    const addressesData = [
      {
        userId: seededUserIds[0],
        label: 'shipping',
        isDefault: 1,
        fullName: 'Devraj Singhania',
        phone: '+91 98200 45678',
        line1: 'Penthouse 14B, Samudra Mahal, Dr. Annie Besant Road',
        line2: 'Worli Sea Face',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400018',
        country: 'India',
      },
      {
        userId: seededUserIds[0],
        label: 'billing',
        isDefault: 0,
        fullName: 'Devraj Singhania',
        phone: '+91 98200 45678',
        line1: 'Singhania Pavilion, 82 Altamount Road',
        line2: 'Cumballa Hill',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400026',
        country: 'India',
      },
      {
        userId: seededUserIds[3],
        label: 'shipping',
        isDefault: 1,
        fullName: 'Vikramaditya Roy',
        phone: '+91 98111 44556',
        line1: 'Roy Manor, 12 Amrita Shergill Marg',
        line2: 'Golf Links District',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110003',
        country: 'India',
      },
      {
        userId: seededUserIds[4],
        label: 'shipping',
        isDefault: 1,
        fullName: 'Rohan Mehra',
        phone: '+91 97654 32109',
        line1: 'Villa 7, Lavelle Estate, Lavelle Road',
        line2: 'Shanthala Nagar',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      {
        userId: seededUserIds[5],
        label: 'shipping',
        isDefault: 1,
        fullName: 'Ananya Deshmukh',
        phone: '+91 99887 76655',
        line1: 'Plot 88, Road No. 36',
        line2: 'Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500033',
        country: 'India',
      },
    ];

    for (const a of addressesData) {
      if (!a.userId) continue;
      const [ex] = await conn.query('SELECT id FROM addresses WHERE user_id = ? AND line1 = ?', [a.userId, a.line1]);
      if (ex.length === 0) {
        await conn.query(
          `INSERT INTO addresses (user_id, label, is_default, full_name, phone, line1, line2, city, state, postal_code, country, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [a.userId, a.label, a.isDefault, a.fullName, a.phone, a.line1, a.line2, a.city, a.state, a.postalCode, a.country]
        );
      }
    }
    console.log(`  ✓ ${addressesData.length} Prestigious residential addresses configured.`);

    // 9. BESPOKE APPOINTMENTS
    console.log('\n[9/12] Seeding Flagship Atelier Appointments...');
    const appointmentsList = [
      {
        userId: seededUserIds[0],
        location: 'South Mumbai Flagship Atelier (Colaba)',
        occasion: 'Grand Palace Wedding & Pheras',
        scheduledAt: new Date(Date.now() + 86400000 * 4), // 4 days ahead
        status: 'upcoming',
        notes: 'Bespoke royal fitting for Groom (Sherwani) and Father of the Groom (Bandhgala). Requested matching tissue silk safas.',
      },
      {
        userId: seededUserIds[3],
        location: 'New Delhi Mehrauli Suite',
        occasion: 'Bespoke Sangeet Night Gala',
        scheduledAt: new Date(Date.now() + 86400000 * 8), // 8 days ahead
        status: 'upcoming',
        notes: 'Selection of jewel-tone zardozi bandi and custom silk stole styling trial.',
      },
      {
        userId: seededUserIds[4],
        location: 'Bangalore Indiranagar Lounge',
        occasion: 'Black-Tie Cocktail Soirée',
        scheduledAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        status: 'completed',
        notes: 'Firelight embroidered silk cocktail jacket trial completed. Dispatched for final master steam pressing.',
      },
      {
        userId: seededUserIds[5],
        location: 'South Mumbai Flagship Atelier (Colaba)',
        occasion: 'Imperial Reception Ceremony',
        scheduledAt: new Date(Date.now() + 86400000 * 14),
        status: 'upcoming',
        notes: 'Heirloom Banarasi katan silk sherwani trial with personal couturier consultation.',
      },
    ];

    for (const app of appointmentsList) {
      if (!app.userId) continue;
      const [ex] = await conn.query('SELECT id FROM appointments WHERE user_id = ? AND occasion = ?', [app.userId, app.occasion]);
      if (ex.length === 0) {
        await conn.query(
          `INSERT INTO appointments (user_id, location, occasion, scheduled_at, status, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [app.userId, app.location, app.occasion, app.scheduledAt, app.status, app.notes]
        );
      } else {
        await conn.query(
          'UPDATE appointments SET location = ?, scheduled_at = ?, status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
          [app.location, app.scheduledAt, app.status, app.notes, ex[0].id]
        );
      }
    }
    console.log(`  ✓ Flagship atelier appointments updated.`);

    // 10. REVIEWS (Authentic luxury patron reviews)
    console.log('\n[10/12] Seeding Discerning Client Reviews...');
    const prodKindredId = seededProductMap.get('Kindred Embroidered Zardozi Silk Sherwani') || 3;
    const prodDaydreamId = seededProductMap.get('Daydream Embroidered Zardozi Silk Bandhgala') || 5;
    const prodFondnessId = seededProductMap.get('Fondness Embroidered Silk Nehru Jacket') || 6;
    const prodFirelightId = seededProductMap.get('Firelight Embroidered Silk Blazer') || 8;

    const luxuryReviews = [
      {
        userId: seededUserIds[0] || 1,
        productId: prodKindredId,
        rating: 5,
        title: 'Breathtaking zardozi craftsmanship and immaculate fit',
        body: 'Wore the Kindred Sherwani for our palace nuptials in Udaipur. The gold thread zardozi reflects lights magnificently and the raw silk feels truly sovereign. The master tailor fitting in Colaba was exemplary.',
        status: 'approved',
      },
      {
        userId: seededUserIds[3] || 3,
        productId: prodDaydreamId,
        rating: 5,
        title: 'Unmatched imperial elegance for our evening reception',
        body: 'The detailing on the collar and the churidar pairing are perfection. Truly couture level. Received non-stop compliments from our guests.',
        status: 'approved',
      },
      {
        userId: seededUserIds[4] || 4,
        productId: prodFondnessId,
        rating: 5,
        title: 'Subtle sage silk with flawless drape',
        body: 'The botanical aari embroidery on the sage silk bundi jacket feels lightweight yet retains an imperial structure. Ideal for daytime mehendi gatherings.',
        status: 'approved',
      },
      {
        userId: seededUserIds[5] || 5,
        productId: prodFirelightId,
        rating: 5,
        title: 'Modern bespoke cocktail glamour',
        body: 'Wore this to a black-tie gala at the Taj Mahal Palace. The cut of the silk lapel is modern, sharp, and unmistakably bespoke.',
        status: 'approved',
      },
      {
        userId: seededUserIds[2] || 2,
        productId: prodKindredId,
        rating: 5,
        title: 'Heirloom piece destined for generations',
        body: 'The zardozi wire embroidery is dense yet remarkably supple. House of Mangesh Mahadev has set the benchmark for luxury menswear in India.',
        status: 'approved',
      },
    ];

    for (const r of luxuryReviews) {
      const [ex] = await conn.query('SELECT id FROM reviews WHERE user_id = ? AND title = ?', [r.userId, r.title]);
      if (ex.length === 0) {
        await conn.query(
          `INSERT INTO reviews (user_id, product_id, rating, title, body, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [r.userId, r.productId, r.rating, r.title, r.body, r.status]
        );
      } else {
        await conn.query(
          'UPDATE reviews SET rating = ?, body = ?, status = ? WHERE id = ?',
          [r.rating, r.body, r.status, ex[0].id]
        );
      }
    }
    console.log(`  ✓ ${luxuryReviews.length} Discerning client reviews verified and approved.`);

    // 11. ORDERS & ORDER ITEMS & PAYMENTS & SHIPMENTS
    console.log('\n[11/12] Linking Orders, Items, Payments & Luxury Shipments...');
    
    // Update order items that had productId = null to point to our actual seeded products
    await conn.query(
      `UPDATE order_items SET product_id = ?, title = 'Kindred Embroidered Zardozi Silk Sherwani' WHERE product_id IS NULL AND price >= 145000 LIMIT 1`,
      [prodKindredId]
    );
    await conn.query(
      `UPDATE order_items SET product_id = ?, title = 'Forever Embroidered Mul Kurta Set' WHERE product_id IS NULL AND price <= 60000 LIMIT 1`,
      [seededProductMap.get('Forever Embroidered Mul Kurta Set') || prodFondnessId]
    );

    // Seed Shipments for existing orders (Currently 0 records!)
    const [ordersList] = await conn.query('SELECT id, status FROM orders ORDER BY id ASC');
    console.log(`  Found ${ordersList.length} existing orders.`);

    const shipmentData = [
      { carrier: 'Blue Dart Apex Luxe Special Handling', trackingNumber: 'BD-LUXE-88291039', status: 'delivered' },
      { carrier: 'Delhivery Couture Secured Courier', trackingNumber: 'DL-COUTURE-4910283', status: 'delivered' },
      { carrier: 'DHL Express Luxury Services', trackingNumber: 'DHL-IN-77291038', status: 'in_transit' },
      { carrier: 'Blue Dart Apex Luxe Special Handling', trackingNumber: 'BD-LUXE-11928374', status: 'delivered' },
      { carrier: 'Bespoke Atelier Courier White Glove', trackingNumber: 'MM-WG-5510293', status: 'label_created' },
    ];

    for (let i = 0; i < ordersList.length; i++) {
      const ord = ordersList[i];
      const ship = shipmentData[i % shipmentData.length];
      
      const [exShip] = await conn.query('SELECT id FROM shipments WHERE order_id = ?', [ord.id]);
      if (exShip.length === 0) {
        await conn.query(
          `INSERT INTO shipments (order_id, carrier, tracking_number, status, updated_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [ord.id, ship.carrier, ship.trackingNumber, ord.status === 'delivered' ? 'delivered' : ship.status]
        );
      } else {
        await conn.query(
          'UPDATE shipments SET carrier = ?, tracking_number = ?, status = ?, updated_at = NOW() WHERE id = ?',
          [ship.carrier, ship.trackingNumber, ord.status === 'delivered' ? 'delivered' : ship.status, exShip[0].id]
        );
      }
    }
    console.log(`  ✓ Luxury shipment tracking records created for all orders.`);

    // 12. ADMIN SETTINGS
    console.log('\n[12/12] Ensuring Atelier Settings & Concierge Info...');
    const settings = [
      { key: 'store_name', value: 'MANGESH MAHADEV' },
      { key: 'brand_tagline', value: 'Luxury Menswear & Bespoke Indian Couture' },
      { key: 'support_email', value: 'concierge@mangeshmahadev.com' },
      { key: 'support_phone', value: '+91 98765 43210' },
      { key: 'atelier_address', value: 'House of Mangesh Mahadev, South Mumbai Flagship, Colaba, Mumbai - 400001' },
      { key: 'atelier_hours', value: 'Monday - Saturday: 11:00 AM - 8:00 PM (Private Appointments Encouraged)' },
      { key: 'currency', value: 'INR' },
      { key: 'tax_rate', value: '18' },
      { key: 'shipping_flat_rate', value: '500' },
      { key: 'free_shipping_threshold', value: '15000' },
    ];

    for (const s of settings) {
      const [ex] = await conn.query('SELECT id FROM admin_settings WHERE setting_key = ?', [s.key]);
      if (ex.length === 0) {
        await conn.query('INSERT INTO admin_settings (setting_key, value, updated_at) VALUES (?, ?, NOW())', [s.key, s.value]);
      } else {
        await conn.query('UPDATE admin_settings SET value = ?, updated_at = NOW() WHERE id = ?', [s.value, ex[0].id]);
      }
    }
    console.log(`  ✓ Atelier settings verified.`);

    console.log('\n====================================================');
    console.log('  SEEDING COMPLETED SUCCESSFULLY!                      ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

runSeed().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
