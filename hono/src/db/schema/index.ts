import { mysqlTable, int, varchar, text, decimal, boolean, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

// Users Table
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  role: mysqlEnum('role', ['admin', 'customer']).default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Password Reset Tokens Table
export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Order Items Table
export const orderItems = mysqlTable('order_items', {
  id: int('id').autoincrement().primaryKey(),
  orderId: int('order_id').notNull(),
  productId: int('product_id'),
  title: varchar('title', { length: 255 }).notNull(),
  quantity: int('quantity').default(1).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
});

// Bespoke Appointments Table
export const appointments = mysqlTable('appointments', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  occasion: varchar('occasion', { length: 255 }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: mysqlEnum('status', ['upcoming', 'completed', 'cancelled']).default('upcoming').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Wishlist Items Table
export const wishlistItems = mysqlTable('wishlist_items', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  productId: int('product_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Addresses Table
export const addresses = mysqlTable('addresses', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  label: mysqlEnum('label', ['shipping', 'billing']).default('shipping').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  line1: varchar('line1', { length: 255 }).notNull(),
  line2: varchar('line2', { length: 255 }),
  city: varchar('city', { length: 128 }).notNull(),
  state: varchar('state', { length: 128 }).notNull(),
  postalCode: varchar('postal_code', { length: 16 }).notNull(),
  country: varchar('country', { length: 128 }).default('India').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Haute Couture Measurements Table
export const userMeasurements = mysqlTable('user_measurements', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().unique(),
  chest: decimal('chest', { precision: 5, scale: 2 }),
  waist: decimal('waist', { precision: 5, scale: 2 }),
  hip: decimal('hip', { precision: 5, scale: 2 }),
  shoulder: decimal('shoulder', { precision: 5, scale: 2 }),
  sleeveLength: decimal('sleeve_length', { precision: 5, scale: 2 }),
  inseam: decimal('inseam', { precision: 5, scale: 2 }),
  unit: mysqlEnum('unit', ['inches', 'cm']).default('inches').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Categories Table
export const categories = mysqlTable('categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Products Table
export const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }),
  stock: int('stock').default(0).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  categoryId: int('category_id'),
  isActive: boolean('is_active').default(true).notNull(),
  imageFront: text('image_front'),
  imageDetail: text('image_detail'),
  color: varchar('color', { length: 100 }),
  colorHex: varchar('color_hex', { length: 50 }),
  craft: text('craft'),
  badge: varchar('badge', { length: 100 }),
  sizes: text('sizes'),
  inStockSizes: text('in_stock_sizes'),
  readyToShip: boolean('ready_to_ship').default(true),
  editorialStory: text('editorial_story'),
  styleNumber: varchar('style_number', { length: 100 }),
  measurements: text('measurements'),
  fabricContent: text('fabric_content'),
  componentsCount: int('components_count').default(1),
  setIncludes: text('set_includes'),
  washCare: varchar('wash_care', { length: 255 }),
  countryOfOrigin: varchar('country_of_origin', { length: 100 }).default('India'),
  manufacturerAddress: text('manufacturer_address'),
  returnsPolicy: text('returns_policy'),
  disclaimer: text('disclaimer'),
  deliveryMethod: varchar('delivery_method', { length: 50 }).default('both'),
  colorVariants: text('color_variants'),
  gallery: text('gallery'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Orders Table
export const orders = mysqlTable('orders', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Admin-managed operational data. These tables intentionally have no public
// routes; they are accessed through the role-protected admin module.
export const designers = mysqlTable('designers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collections = mysqlTable('collections', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const media = mysqlTable('media', {
  id: int('id').autoincrement().primaryKey(),
  url: varchar('url', { length: 1000 }).notNull(),
  altText: varchar('alt_text', { length: 255 }),
  kind: mysqlEnum('kind', ['image', 'video', 'document']).default('image').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = mysqlTable('reviews', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  productId: int('product_id'),
  rating: int('rating').notNull(),
  title: varchar('title', { length: 255 }),
  body: text('body'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = mysqlTable('payments', {
  id: int('id').autoincrement().primaryKey(),
  orderId: int('order_id').notNull(),
  provider: varchar('provider', { length: 64 }).notNull(),
  reference: varchar('reference', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['pending', 'paid', 'failed', 'refunded']).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const shipments = mysqlTable('shipments', {
  id: int('id').autoincrement().primaryKey(),
  orderId: int('order_id').notNull(),
  carrier: varchar('carrier', { length: 128 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'label_created', 'in_transit', 'delivered']).default('pending').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const adminSettings = mysqlTable('admin_settings', {
  id: int('id').autoincrement().primaryKey(),
  settingKey: varchar('setting_key', { length: 128 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').autoincrement().primaryKey(),
  actorId: int('actor_id').notNull(),
  action: varchar('action', { length: 128 }).notNull(),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: int('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type inference directly from DB schema for backend domain usage
export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
export type ProductRecord = typeof products.$inferSelect;
export type NewProductRecord = typeof products.$inferInsert;
export type OrderRecord = typeof orders.$inferSelect;
export type NewOrderRecord = typeof orders.$inferInsert;
export type OrderItemRecord = typeof orderItems.$inferSelect;
export type AppointmentRecord = typeof appointments.$inferSelect;
export type WishlistItemRecord = typeof wishlistItems.$inferSelect;
export type AddressRecord = typeof addresses.$inferSelect;
export type UserMeasurementsRecord = typeof userMeasurements.$inferSelect;
