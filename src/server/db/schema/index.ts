// PostgreSQL schema used by the storefront and admin API.
import { pgTable, integer, varchar, text, numeric, boolean, timestamp, index, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const emailOutbox = pgTable('email_outbox', {
  id: varchar('id', { length: 64 }).primaryKey().default(sql`gen_random_uuid()::text`),
  eventKey: varchar('event_key', { length: 255 }).notNull().unique(),
  kind: varchar('kind', { length: 64, enum: ['welcome', 'order_placed', 'appointment_booked', 'appointment_rescheduled', 'appointment_cancelled'] }).notNull(),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 16, enum: ['pending', 'sending', 'sent', 'failed'] }).default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).defaultNow().notNull(),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockToken: varchar('lock_token', { length: 64 }),
  lastError: varchar('last_error', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
}, table => [index('email_outbox_pending_idx').on(table.status, table.nextAttemptAt)]);

export const adminRecordArchives = pgTable('admin_record_archives', {
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: integer('entity_id').notNull(),
  actorId: integer('actor_id').notNull(),
  reason: varchar('reason', { length: 500 }).notNull(),
  archivedAt: timestamp('archived_at').defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.entityType, table.entityId] })]);

export const emailOtpChallenges = pgTable('email_otp_challenges', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  browserHash: varchar('browser_hash', { length: 64 }).notNull(),
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  development: boolean('development').default(false).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  termsAcceptedAt: timestamp('terms_accepted_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
}, table => [index('otp_email_created_idx').on(table.email, table.createdAt)]);

export const customerAuthConsents = pgTable('customer_auth_consents', {
  userId: integer('user_id').primaryKey(),
  termsAcceptedAt: timestamp('terms_accepted_at').notNull(),
  termsVersion: varchar('terms_version', { length: 32 }).notNull(),
  newsletterOptIn: boolean('newsletter_opt_in').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Users Table
export const users = pgTable('users', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  role: varchar('role', { length: 64, enum: ['admin', 'customer'] }).default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Password Reset Tokens Table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  userId: integer('user_id').notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Order Items Table
export const orderItems = pgTable('order_items', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  orderId: integer('order_id').notNull(),
  productId: integer('product_id'),
  title: varchar('title', { length: 255 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
});

// Bespoke Appointments Table
export const appointments = pgTable('appointments', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  userId: integer('user_id').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  occasion: varchar('occasion', { length: 255 }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: varchar('status', { length: 64, enum: ['upcoming', 'completed', 'cancelled'] }).default('upcoming').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Wishlist Items Table
export const wishlistItems = pgTable('wishlist_items', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  userId: integer('user_id').notNull(),
  productId: integer('product_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Addresses Table
export const addresses = pgTable('addresses', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  userId: integer('user_id').notNull(),
  label: varchar('label', { length: 64, enum: ['shipping', 'billing'] }).default('shipping').notNull(),
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
export const userMeasurements = pgTable('user_measurements', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  userId: integer('user_id').notNull().unique(),
  chest: numeric('chest', { precision: 5, scale: 2 }),
  waist: numeric('waist', { precision: 5, scale: 2 }),
  hip: numeric('hip', { precision: 5, scale: 2 }),
  shoulder: numeric('shoulder', { precision: 5, scale: 2 }),
  sleeveLength: numeric('sleeve_length', { precision: 5, scale: 2 }),
  inseam: numeric('inseam', { precision: 5, scale: 2 }),
  unit: varchar('unit', { length: 64, enum: ['inches', 'cm'] }).default('inches').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Categories Table
export const categories = pgTable('categories', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Products Table
export const products = pgTable('products', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  categoryId: integer('category_id'),
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
  componentsCount: integer('components_count').default(1),
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
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Orders Table
export const orders = pgTable('orders', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  userId: integer('user_id'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 64, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Admin-managed operational data. These tables intentionally have no public
// routes; they are accessed through the role-protected admin module.
export const designers = pgTable('designers', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collections = pgTable('collections', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const media = pgTable('media', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  url: varchar('url', { length: 1000 }).notNull(),
  altText: varchar('alt_text', { length: 255 }),
  kind: varchar('kind', { length: 64, enum: ['image', 'video', 'document'] }).default('image').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  userId: integer('user_id').notNull(),
  productId: integer('product_id'),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 255 }),
  body: text('body'),
  status: varchar('status', { length: 64, enum: ['pending', 'approved', 'rejected'] }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  orderId: integer('order_id').notNull(),
  provider: varchar('provider', { length: 64 }).notNull(),
  reference: varchar('reference', { length: 255 }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 64, enum: ['pending', 'paid', 'failed', 'refunded'] }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const shipments = pgTable('shipments', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  orderId: integer('order_id').notNull(),
  carrier: varchar('carrier', { length: 128 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  status: varchar('status', { length: 64, enum: ['pending', 'label_created', 'in_transit', 'delivered'] }).default('pending').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const adminSettings = pgTable('admin_settings', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  settingKey: varchar('setting_key', { length: 128 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
  actorId: integer('actor_id').notNull(),
  action: varchar('action', { length: 128 }).notNull(),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: integer('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type inference directly from DB schema for backend domain usage
// Checkout snapshots are separate from the original operational tables so older
// orders remain readable and address edits never change a placed order.
export const orderCheckoutDetails = pgTable('order_checkout_details', {
  orderId: integer('order_id').primaryKey(),
  userId: integer('user_id'),
  requestKey: varchar('request_key', { length: 64 }).notNull().unique(),
  requestHash: varchar('request_hash', { length: 64 }).notNull(),
  shippingAddress: text('shipping_address'),
  fulfilment: varchar('fulfilment', { length: 64, enum: ['home', 'pickup'] }).notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingAmount: numeric('shipping_amount', { precision: 10, scale: 2 }).notNull(),
});
export const orderItemVariants = pgTable('order_item_variants', {
  orderItemId: integer('order_item_id').primaryKey(),
  size: varchar('size', { length: 64 }).notNull(),
  color: varchar('color', { length: 100 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  imageUrl: text('image_url'),
});
export const revokedSessions = pgTable('revoked_sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const guestSessions = pgTable('guest_sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
});
export const guestOrderDetails = pgTable('guest_order_details', {
  orderId: integer('order_id').primaryKey(),
  sessionHash: varchar('session_hash', { length: 64 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
});
export const googleIdentities = pgTable('google_identities', {
  subject: varchar('subject', { length: 255 }).primaryKey(),
  userId: integer('user_id').notNull().unique(),
});

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
