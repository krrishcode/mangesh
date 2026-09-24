import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { hashPassword } from '../hono/src/lib/auth.js';
import * as schema from '../hono/src/db/schema/index.js';

async function seed() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: 'srv2218.hstgr.io',
    user: 'u770723413_mangeshmahadev',
    password: '1Igk#Wu/M',
    database: 'u770723413_mangeshmahadev'
  });

  const db = drizzle(connection, { schema, mode: 'default' });

  console.log('Inserting user...');
  const passwordHash = await hashPassword('password123');
  
  const [userResult] = await db.insert(schema.users).values({
    email: 'testuser@example.com',
    name: 'Test Customer',
    passwordHash: passwordHash,
    phone: '+91 98765 43210',
    role: 'customer'
  });
  const userId = userResult.insertId;

  console.log('Inserting address...');
  await db.insert(schema.addresses).values({
    userId,
    label: 'shipping',
    isDefault: true,
    fullName: 'Test Customer',
    phone: '+91 98765 43210',
    line1: '123 Fake Street',
    line2: 'Apt 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India'
  });

  console.log('Inserting measurements...');
  await db.insert(schema.userMeasurements).values({
    userId,
    chest: '40.0',
    waist: '32.0',
    hip: '42.0',
    shoulder: '18.5',
    sleeveLength: '25.0',
    inseam: '32.0',
    unit: 'inches'
  });

  console.log('Inserting orders...');
  const [order1] = await db.insert(schema.orders).values({
    userId,
    totalAmount: '145000',
    status: 'delivered'
  });
  
  await db.insert(schema.orderItems).values({
    orderId: order1.insertId,
    productId: null,
    title: 'The Midnight Velvet Sherwani',
    quantity: 1,
    price: '145000'
  });

  const [order2] = await db.insert(schema.orders).values({
    userId,
    totalAmount: '45000',
    status: 'pending'
  });

  await db.insert(schema.orderItems).values({
    orderId: order2.insertId,
    productId: null,
    title: 'Ivory Silk Kurta Set',
    quantity: 1,
    price: '45000'
  });

  console.log('Inserting appointments...');
  await db.insert(schema.appointments).values({
    userId,
    location: 'Mumbai Flagship Store',
    occasion: 'Wedding Readiwear Fitting',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    status: 'upcoming',
    notes: 'Needs bespoke measurements for Sherwani'
  });

  // Check if we have products to create wishlist items
  const productsResult = await db.select().from(schema.products).limit(2);
  let p1, p2;
  
  if (productsResult.length >= 2) {
    p1 = productsResult[0].id;
    p2 = productsResult[1].id;
  } else {
    // create dummy products
    const [ins1] = await db.insert(schema.products).values({
      title: 'Emerald Bandhgala',
      slug: 'emerald-bandhgala-' + Date.now(),
      price: '85000',
      stock: 5,
      sku: 'SKU-EB-' + Date.now()
    });
    const [ins2] = await db.insert(schema.products).values({
      title: 'Royal Blue Kurta',
      slug: 'royal-blue-kurta-' + Date.now(),
      price: '35000',
      stock: 10,
      sku: 'SKU-RB-' + Date.now()
    });
    p1 = ins1.insertId;
    p2 = ins2.insertId;
  }

  console.log('Inserting wishlist items...');
  await db.insert(schema.wishlistItems).values([
    { userId, productId: p1 },
    { userId, productId: p2 }
  ]);

  console.log('Seed completed successfully!');
  await connection.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});