import { and, count, desc, eq, sql, sum } from 'drizzle-orm';
import { db } from '../db';
import {
  adminSettings,
  appointments,
  categories,
  guestOrderDetails,
  orders,
  payments,
  products,
  reviews,
  users,
} from '../db/schema';
import { json, type ApiContext } from '../http/context';
import { cancelOrder } from '../lib/order-actions';
import {
  changePaymentStatus,
  manualPaymentSchema,
  paymentStatusSchema,
  recordManualPayment,
} from '../lib/payment-actions';
import { orderData } from './orders';

function bodyOf(c: ApiContext): Record<string, any> {
  return (c.body ?? {}) as Record<string, any>;
}

export async function adminDashboard(c: ApiContext) {
  try {
    const [productCount] = await db.select({ value: count() }).from(products);
    const [orderCount] = await db.select({ value: count() }).from(orders);
    const [customerCount] = await db.select({ value: count() }).from(users).where(eq(users.role, 'customer'));
    const [revenueResult] = await db.select({ value: sum(orders.totalAmount) }).from(orders);
    const [pendingOrders] = await db.select({ value: count() }).from(orders).where(eq(orders.status, 'pending'));
    const [lowStockCount] = await db
      .select({ value: count() })
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} <= 5`));

    const recentOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        customerName: sql<string>`coalesce(${users.name}, ${guestOrderDetails.name})`,
        customerEmail: sql<string>`coalesce(${users.email}, ${guestOrderDetails.email})`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(guestOrderDetails, eq(orders.id, guestOrderDetails.orderId))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return json(c, {
      success: true,
      data: {
        stats: {
          totalProducts: productCount.value,
          totalOrders: orderCount.value,
          totalCustomers: customerCount.value,
          totalRevenue: Number(revenueResult.value ?? 0),
          pendingOrders: pendingOrders.value,
          lowStockItems: lowStockCount.value,
        },
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          order_number: `ORD-${String(order.id).padStart(4, '0')}`,
          customer_name: order.customerName ?? 'Unknown',
          customer_email: order.customerEmail ?? '',
          total_amount: Number(order.totalAmount),
          status: order.status,
          created_at: order.createdAt,
        })),
      },
    });
  } catch {
    return json(c, {
      success: true,
      data: {
        stats: { totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0, pendingOrders: 0, lowStockItems: 0 },
        recentOrders: [],
      },
    });
  }
}

const productFields = {
  id: products.id,
  title: products.title,
  slug: products.slug,
  description: products.description,
  price: products.price,
  salePrice: products.salePrice,
  stock: products.stock,
  sku: products.sku,
  categoryId: products.categoryId,
  categoryName: categories.name,
  isActive: products.isActive,
  imageFront: products.imageFront,
  imageDetail: products.imageDetail,
  color: products.color,
  colorHex: products.colorHex,
  craft: products.craft,
  badge: products.badge,
  sizes: products.sizes,
  inStockSizes: products.inStockSizes,
  readyToShip: products.readyToShip,
  editorialStory: products.editorialStory,
  styleNumber: products.styleNumber,
  measurements: products.measurements,
  fabricContent: products.fabricContent,
  componentsCount: products.componentsCount,
  setIncludes: products.setIncludes,
  washCare: products.washCare,
  countryOfOrigin: products.countryOfOrigin,
  manufacturerAddress: products.manufacturerAddress,
  returnsPolicy: products.returnsPolicy,
  disclaimer: products.disclaimer,
  deliveryMethod: products.deliveryMethod,
  colorVariants: products.colorVariants,
  gallery: products.gallery,
  createdAt: products.createdAt,
};

export async function adminProducts(c: ApiContext) {
  try {
    const allProducts = await db
      .select(productFields)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));
    return json(c, { success: true, data: allProducts });
  } catch {
    return json(c, { success: true, data: [] });
  }
}

export async function adminCreateProduct(c: ApiContext) {
  const body = bodyOf(c);
  const {
    title, slug, description, price, salePrice, stock, sku, categoryId, isActive,
    imageFront, imageDetail, color, colorHex, craft, badge, sizes, inStockSizes,
    readyToShip, editorialStory, styleNumber, measurements, fabricContent,
    componentsCount, setIncludes, washCare, countryOfOrigin, manufacturerAddress,
    returnsPolicy, disclaimer, deliveryMethod, colorVariants, gallery,
  } = body;

  if (!title || !slug || !price || !sku) {
    return json(c, { success: false, error: 'title, slug, price, and sku are required' }, 400);
  }

  const [header] = await db.insert(products).values({
    title, slug, description: description ?? null,
    price: String(price), salePrice: salePrice ? String(salePrice) : null,
    stock: stock !== undefined ? Number(stock) : 0, sku,
    categoryId: categoryId ? Number(categoryId) : null,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    imageFront: imageFront || null,
    imageDetail: imageDetail || null,
    color: color || null,
    colorHex: colorHex || null,
    craft: craft || null,
    badge: badge || null,
    sizes: typeof sizes === 'object' ? JSON.stringify(sizes) : (sizes || null),
    inStockSizes: typeof inStockSizes === 'object' ? JSON.stringify(inStockSizes) : (inStockSizes || null),
    readyToShip: readyToShip !== undefined ? Boolean(readyToShip) : true,
    editorialStory: editorialStory || null,
    styleNumber: styleNumber || null,
    measurements: measurements || null,
    fabricContent: fabricContent || null,
    componentsCount: componentsCount ? Number(componentsCount) : 1,
    setIncludes: setIncludes || null,
    washCare: washCare || null,
    countryOfOrigin: countryOfOrigin || 'India',
    manufacturerAddress: manufacturerAddress || null,
    returnsPolicy: returnsPolicy || null,
    disclaimer: disclaimer || null,
    deliveryMethod: deliveryMethod || 'both',
    colorVariants: typeof colorVariants === 'object' ? JSON.stringify(colorVariants) : (colorVariants || null),
    gallery: typeof gallery === 'object' ? JSON.stringify(gallery) : (gallery || null),
  });

  const [created] = await db.select().from(products).where(eq(products.id, header.insertId)).limit(1);
  return json(c, { success: true, data: created, message: 'Product created' }, 201);
}

export async function adminProduct(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return json(c, { success: false, error: 'Invalid product ID' }, 400);
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return json(c, { success: false, error: 'Product not found' }, 404);
  return json(c, { success: true, data: row });
}

export async function adminUpdateProduct(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isInteger(id)) return json(c, { success: false, error: 'Invalid ID' }, 400);

  const body = bodyOf(c);
  const values: Record<string, unknown> = {};

  if (body.title !== undefined) values.title = body.title;
  if (body.slug !== undefined) values.slug = body.slug;
  if (body.description !== undefined) values.description = body.description;
  if (body.price !== undefined) values.price = String(body.price);
  if (body.salePrice !== undefined) values.salePrice = body.salePrice ? String(body.salePrice) : null;
  if (body.stock !== undefined) values.stock = Number(body.stock);
  if (body.sku !== undefined) values.sku = body.sku;
  if (body.categoryId !== undefined) values.categoryId = body.categoryId ? Number(body.categoryId) : null;
  if (body.isActive !== undefined) values.isActive = Boolean(body.isActive);

  if (body.imageFront !== undefined) values.imageFront = body.imageFront || null;
  if (body.imageDetail !== undefined) values.imageDetail = body.imageDetail || null;
  if (body.color !== undefined) values.color = body.color || null;
  if (body.colorHex !== undefined) values.colorHex = body.colorHex || null;
  if (body.craft !== undefined) values.craft = body.craft || null;
  if (body.badge !== undefined) values.badge = body.badge || null;
  if (body.sizes !== undefined) values.sizes = typeof body.sizes === 'object' ? JSON.stringify(body.sizes) : body.sizes;
  if (body.inStockSizes !== undefined) values.inStockSizes = typeof body.inStockSizes === 'object' ? JSON.stringify(body.inStockSizes) : body.inStockSizes;
  if (body.readyToShip !== undefined) values.readyToShip = Boolean(body.readyToShip);
  if (body.editorialStory !== undefined) values.editorialStory = body.editorialStory || null;
  if (body.styleNumber !== undefined) values.styleNumber = body.styleNumber || null;
  if (body.measurements !== undefined) values.measurements = body.measurements || null;
  if (body.fabricContent !== undefined) values.fabricContent = body.fabricContent || null;
  if (body.componentsCount !== undefined) values.componentsCount = body.componentsCount ? Number(body.componentsCount) : 1;
  if (body.setIncludes !== undefined) values.setIncludes = body.setIncludes || null;
  if (body.washCare !== undefined) values.washCare = body.washCare || null;
  if (body.countryOfOrigin !== undefined) values.countryOfOrigin = body.countryOfOrigin || 'India';
  if (body.manufacturerAddress !== undefined) values.manufacturerAddress = body.manufacturerAddress || null;
  if (body.returnsPolicy !== undefined) values.returnsPolicy = body.returnsPolicy || null;
  if (body.disclaimer !== undefined) values.disclaimer = body.disclaimer || null;
  if (body.deliveryMethod !== undefined) values.deliveryMethod = body.deliveryMethod || 'both';
  if (body.colorVariants !== undefined) values.colorVariants = typeof body.colorVariants === 'object' ? JSON.stringify(body.colorVariants) : body.colorVariants;
  if (body.gallery !== undefined) values.gallery = typeof body.gallery === 'object' ? JSON.stringify(body.gallery) : body.gallery;

  await db.update(products).set(values).where(eq(products.id, id));
  const [updated] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return json(c, { success: true, data: updated, message: 'Product updated' });
}

export async function adminDeleteProduct(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isInteger(id)) return json(c, { success: false, error: 'Invalid ID' }, 400);
  await db.delete(products).where(eq(products.id, id));
  return json(c, { success: true, message: 'Product deleted' });
}

export async function adminOrders(c: ApiContext) {
  try {
    const allOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: sql<string>`coalesce(${users.name}, ${guestOrderDetails.name})`,
        customerEmail: sql<string>`coalesce(${users.email}, ${guestOrderDetails.email})`,
        customerPhone: guestOrderDetails.phone,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(guestOrderDetails, eq(orders.id, guestOrderDetails.orderId))
      .orderBy(desc(orders.createdAt));

    const expanded = await orderData(allOrders);

    const data = allOrders.map((order) => ({
      ...expanded.find((entry) => entry.id === order.id),
      id: order.id,
      order_number: `ORD-${String(order.id).padStart(4, '0')}`,
      customer_name: order.customerName ?? 'Unknown',
      customer_email: order.customerEmail ?? '',
      customer_phone: order.customerPhone ?? '',
      guest: order.userId === null,
      total_amount: Number(order.totalAmount),
      status: order.status,
      created_at: order.createdAt,
    }));

    return json(c, { success: true, data });
  } catch {
    return json(c, { success: false, error: 'Orders could not be loaded. Please try again.' }, 503);
  }
}

export async function adminUpdateOrderStatus(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isInteger(id)) return json(c, { success: false, error: 'Invalid ID' }, 400);
  const { status } = bodyOf(c);
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return json(c, { success: false, error: 'Invalid status' }, 400);

  if (status === 'cancelled') {
    await cancelOrder(id);
  } else {
    const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing) return json(c, { success: false, error: 'Order not found' }, 404);
    if (existing.status === 'cancelled') {
      return json(c, { success: false, error: 'A cancelled order cannot be reopened. Create a new order instead.' }, 409);
    }
    await db.update(orders).set({ status }).where(and(eq(orders.id, id), sql`${orders.status} <> 'cancelled'`));
  }
  return json(c, { success: true, message: 'Order status updated' });
}

export async function adminCustomers(c: ApiContext) {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        ordersCount: count(orders.id),
        totalSpent: sum(orders.totalAmount),
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return json(c, {
      success: true,
      data: allUsers.map((user) => ({
        ...user,
        ordersCount: Number(user.ordersCount || 0),
        totalSpent: Number(user.totalSpent || 0),
      })),
    });
  } catch {
    return json(c, { success: true, data: [] });
  }
}

export async function adminCategories(c: ApiContext) {
  try {
    const all = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id)
      .orderBy(desc(categories.createdAt));
    return json(c, { success: true, data: all });
  } catch {
    return json(c, { success: true, data: [] });
  }
}

export async function adminCreateCategory(c: ApiContext) {
  const { name, slug, description } = bodyOf(c);
  if (!name || !slug) return json(c, { success: false, error: 'name and slug required' }, 400);
  const [header] = await db.insert(categories).values({ name, slug, description: description ?? null });
  const [created] = await db.select().from(categories).where(eq(categories.id, header.insertId)).limit(1);
  return json(c, { success: true, data: created, message: 'Category created' }, 201);
}

export async function adminUpdateCategory(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isInteger(id)) return json(c, { success: false, error: 'Invalid ID' }, 400);
  const body = bodyOf(c);
  const values: Record<string, unknown> = {};
  if (body.name !== undefined) values.name = body.name;
  if (body.slug !== undefined) values.slug = body.slug;
  if (body.description !== undefined) values.description = body.description;
  await db.update(categories).set(values).where(eq(categories.id, id));
  return json(c, { success: true, message: 'Category updated' });
}

export async function adminDeleteCategory(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isInteger(id)) return json(c, { success: false, error: 'Invalid ID' }, 400);
  await db.delete(categories).where(eq(categories.id, id));
  return json(c, { success: true, message: 'Category deleted' });
}

export async function adminAppointments(c: ApiContext) {
  try {
    const all = await db
      .select({
        id: appointments.id,
        location: appointments.location,
        occasion: appointments.occasion,
        scheduledAt: appointments.scheduledAt,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .orderBy(desc(appointments.scheduledAt));
    return json(c, { success: true, data: all });
  } catch {
    return json(c, { success: true, data: [] });
  }
}

export async function adminUpdateAppointmentStatus(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isInteger(id)) return json(c, { success: false, error: 'Invalid ID' }, 400);
  const { status } = bodyOf(c);
  const valid = ['upcoming', 'completed', 'cancelled'];
  if (!valid.includes(status)) return json(c, { success: false, error: 'Invalid status' }, 400);
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
  return json(c, { success: true, message: 'Appointment status updated' });
}

export async function adminReviews(c: ApiContext) {
  try {
    const all = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        status: reviews.status,
        createdAt: reviews.createdAt,
        customerName: users.name,
        productTitle: products.title,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(products, eq(reviews.productId, products.id))
      .orderBy(desc(reviews.createdAt));
    return json(c, { success: true, data: all });
  } catch {
    return json(c, { success: true, data: [] });
  }
}

export async function adminUpdateReviewStatus(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isInteger(id)) return json(c, { success: false, error: 'Invalid ID' }, 400);
  const { status } = bodyOf(c);
  const valid = ['pending', 'approved', 'rejected'];
  if (!valid.includes(status)) return json(c, { success: false, error: 'Invalid status' }, 400);
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  return json(c, { success: true, message: 'Review status updated' });
}

export async function adminGetSettings(c: ApiContext) {
  try {
    const all = await db.select().from(adminSettings);
    return json(c, { success: true, data: all });
  } catch {
    return json(c, { success: true, data: [] });
  }
}

export async function adminUpdateSettings(c: ApiContext) {
  const { key, value } = bodyOf(c);
  if (!key) return json(c, { success: false, error: 'key is required' }, 400);

  const [existing] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, key)).limit(1);
  if (existing) {
    await db.update(adminSettings).set({ value }).where(eq(adminSettings.id, existing.id));
  } else {
    await db.insert(adminSettings).values({ settingKey: key, value });
  }
  return json(c, { success: true, message: 'Setting saved' });
}

export async function adminPayments(c: ApiContext) {
  try {
    const allPayments = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        provider: payments.provider,
        reference: payments.reference,
        amount: payments.amount,
        status: payments.status,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        orderStatus: orders.status,
        customerName: sql<string>`coalesce(${users.name}, ${guestOrderDetails.name})`,
        customerEmail: sql<string>`coalesce(${users.email}, ${guestOrderDetails.email})`,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(guestOrderDetails, eq(orders.id, guestOrderDetails.orderId))
      .orderBy(desc(payments.createdAt));

    let totalSettled = 0;
    let pendingCount = 0;
    let successfulCount = 0;
    let refundedVolume = 0;

    allPayments.forEach((payment) => {
      const amount = Number(payment.amount) || 0;
      if (payment.status === 'paid') {
        totalSettled += amount;
        successfulCount++;
      } else if (payment.status === 'pending') {
        pendingCount++;
      } else if (payment.status === 'refunded') {
        refundedVolume += amount;
      }
    });

    return json(c, {
      success: true,
      data: allPayments.map((payment) => ({
        id: payment.id,
        order_id: payment.orderId,
        order_number: `ORD-${String(payment.orderId).padStart(4, '0')}`,
        provider: payment.provider,
        reference: payment.reference || `REF-${payment.id}`,
        amount: Number(payment.amount),
        status: payment.status,
        order_status: payment.orderStatus,
        customer_name: payment.customerName || 'Bespoke Client',
        customer_email: payment.customerEmail || '',
        created_at: payment.createdAt,
        updated_at: payment.updatedAt,
      })),
      stats: {
        total_settled: totalSettled,
        successful_count: successfulCount,
        pending_count: pendingCount,
        refunded_volume: refundedVolume,
        total_count: allPayments.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return json(c, { success: false, error: error.message }, 500);
  }
}

export async function adminRecordPayment(c: ApiContext) {
  const parsed = manualPaymentSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Provide a valid order ID, positive amount, provider and status.' }, 400);
  }
  return json(c, { success: true, data: await recordManualPayment(parsed.data), message: 'Payment recorded' }, 201);
}

export async function adminUpdatePaymentStatus(c: ApiContext) {
  const id = Number(c.params.id);
  const body = bodyOf(c);
  const parsed = paymentStatusSchema.safeParse(body?.status);
  if (!Number.isSafeInteger(id) || id <= 0 || !parsed.success) {
    return json(c, { success: false, error: 'Provide a valid payment ID and status.' }, 400);
  }
  return json(c, { success: true, data: await changePaymentStatus(id, parsed.data), message: 'Payment status updated' });
}
