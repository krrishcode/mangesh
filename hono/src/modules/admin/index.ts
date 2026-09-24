import { Hono } from 'hono';
import { eq, desc, sql, count, sum, and, like, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  products, orders, orderItems, users, categories,
  appointments, reviews, adminSettings, payments
} from '../../db/schema/index.js';
import { requireAuth } from '../../middleware/auth.js';

export const adminModule = new Hono();

// Admin role gate
async function requireAdmin(c: any, next: any) {
  const authUser = c.get('authUser');
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ success: false, error: 'Forbidden: admin access required' }, 403);
  }
  await next();
}

adminModule.use('*', requireAuth);
adminModule.use('*', requireAdmin);

// ─── Dashboard Stats ────────────────────────────────────────────────
adminModule.get('/dashboard', async (c) => {
  try {
    const [productCount] = await db.select({ value: count() }).from(products);
    const [orderCount] = await db.select({ value: count() }).from(orders);
    const [customerCount] = await db.select({ value: count() }).from(users).where(eq(users.role, 'customer'));
    const [revenueResult] = await db.select({ value: sum(orders.totalAmount) }).from(orders);
    const [pendingOrders] = await db.select({ value: count() }).from(orders).where(eq(orders.status, 'pending'));
    const [lowStockCount] = await db.select({ value: count() }).from(products).where(and(eq(products.isActive, true), sql`${products.stock} <= 5`));

    const recentOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return c.json({
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
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          order_number: `ORD-${String(o.id).padStart(4, '0')}`,
          customer_name: o.customerName ?? 'Unknown',
          customer_email: o.customerEmail ?? '',
          total_amount: Number(o.totalAmount),
          status: o.status,
          created_at: o.createdAt,
        })),
      },
    });
  } catch (error: any) {
    return c.json({
      success: true,
      data: {
        stats: { totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0, pendingOrders: 0, lowStockItems: 0 },
        recentOrders: [],
      },
    });
  }
});

// ─── Products CRUD ──────────────────────────────────────────────────
adminModule.get('/products', async (c) => {
  try {
    const allProducts = await db
      .select({
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
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));
    return c.json({ success: true, data: allProducts });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

adminModule.post('/products', async (c) => {
  const body = await c.req.json();
  const {
    title, slug, description, price, salePrice, stock, sku, categoryId, isActive,
    imageFront, imageDetail, color, colorHex, craft, badge, sizes, inStockSizes,
    readyToShip, editorialStory, styleNumber, measurements, fabricContent,
    componentsCount, setIncludes, washCare, countryOfOrigin, manufacturerAddress,
    returnsPolicy, disclaimer, deliveryMethod, colorVariants, gallery,
  } = body;

  if (!title || !slug || !price || !sku) {
    return c.json({ success: false, error: 'title, slug, price, and sku are required' }, 400);
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
  return c.json({ success: true, data: created, message: 'Product created' }, 201);
});

adminModule.put('/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  const body = await c.req.json();
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

  // Extended couture attributes
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
  return c.json({ success: true, data: updated, message: 'Product updated' });
});

adminModule.delete('/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
  await db.delete(products).where(eq(products.id, id));
  return c.json({ success: true, message: 'Product deleted' });
});

// ─── Orders Management ──────────────────────────────────────────────
adminModule.get('/orders', async (c) => {
  try {
    const allOrders = await db
      .select({
        id: orders.id, userId: orders.userId,
        totalAmount: orders.totalAmount, status: orders.status,
        createdAt: orders.createdAt, updatedAt: orders.updatedAt,
        customerName: users.name, customerEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    const orderIds = allOrders.map((o) => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      items = await db.select().from(orderItems).where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);
    }

    const data = allOrders.map((o) => {
      const oItems = items.filter((i) => i.orderId === o.id);
      return {
        id: o.id,
        order_number: `ORD-${String(o.id).padStart(4, '0')}`,
        customer_name: o.customerName ?? 'Unknown',
        customer_email: o.customerEmail ?? '',
        total_amount: Number(o.totalAmount),
        status: o.status,
        items_count: oItems.reduce((s, i) => s + i.quantity, 0),
        items: oItems.map((i) => ({
          id: i.id, title: i.title,
          quantity: i.quantity, price: Number(i.price),
        })),
        created_at: o.createdAt,
      };
    });

    return c.json({ success: true, data });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

adminModule.patch('/orders/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
  const { status } = await c.req.json();
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return c.json({ success: false, error: 'Invalid status' }, 400);

  await db.update(orders).set({ status }).where(eq(orders.id, id));
  return c.json({ success: true, message: 'Order status updated' });
});

// ─── Customers ───────────────────────────────────────────────────────
adminModule.get('/customers', async (c) => {
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

    return c.json({
      success: true,
      data: allUsers.map((u) => ({
        ...u,
        ordersCount: Number(u.ordersCount || 0),
        totalSpent: Number(u.totalSpent || 0),
      })),
    });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

// ─── Categories CRUD ─────────────────────────────────────────────────
adminModule.get('/categories', async (c) => {
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
    return c.json({ success: true, data: all });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

adminModule.post('/categories', async (c) => {
  const { name, slug, description } = await c.req.json();
  if (!name || !slug) return c.json({ success: false, error: 'name and slug required' }, 400);
  const [header] = await db.insert(categories).values({ name, slug, description: description ?? null });
  const [created] = await db.select().from(categories).where(eq(categories.id, header.insertId)).limit(1);
  return c.json({ success: true, data: created, message: 'Category created' }, 201);
});

adminModule.put('/categories/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
  const body = await c.req.json();
  const values: Record<string, unknown> = {};
  if (body.name !== undefined) values.name = body.name;
  if (body.slug !== undefined) values.slug = body.slug;
  if (body.description !== undefined) values.description = body.description;
  await db.update(categories).set(values).where(eq(categories.id, id));
  return c.json({ success: true, message: 'Category updated' });
});

adminModule.delete('/categories/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
  await db.delete(categories).where(eq(categories.id, id));
  return c.json({ success: true, message: 'Category deleted' });
});

// ─── Appointments ────────────────────────────────────────────────────
adminModule.get('/appointments', async (c) => {
  try {
    const all = await db
      .select({
        id: appointments.id, location: appointments.location,
        occasion: appointments.occasion, scheduledAt: appointments.scheduledAt,
        status: appointments.status, notes: appointments.notes,
        createdAt: appointments.createdAt,
        customerName: users.name, customerEmail: users.email,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .orderBy(desc(appointments.scheduledAt));
    return c.json({ success: true, data: all });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

adminModule.patch('/appointments/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
  const { status } = await c.req.json();
  const valid = ['upcoming', 'completed', 'cancelled'];
  if (!valid.includes(status)) return c.json({ success: false, error: 'Invalid status' }, 400);
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
  return c.json({ success: true, message: 'Appointment status updated' });
});

// ─── Reviews Moderation ──────────────────────────────────────────────
adminModule.get('/reviews', async (c) => {
  try {
    const all = await db
      .select({
        id: reviews.id, rating: reviews.rating,
        title: reviews.title, body: reviews.body,
        status: reviews.status, createdAt: reviews.createdAt,
        customerName: users.name,
        productTitle: products.title,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(products, eq(reviews.productId, products.id))
      .orderBy(desc(reviews.createdAt));
    return c.json({ success: true, data: all });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

adminModule.patch('/reviews/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
  const { status } = await c.req.json();
  const valid = ['pending', 'approved', 'rejected'];
  if (!valid.includes(status)) return c.json({ success: false, error: 'Invalid status' }, 400);
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  return c.json({ success: true, message: 'Review status updated' });
});

// ─── Settings ────────────────────────────────────────────────────────
adminModule.get('/settings', async (c) => {
  try {
    const all = await db.select().from(adminSettings);
    return c.json({ success: true, data: all });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

adminModule.put('/settings', async (c) => {
  const { key, value } = await c.req.json();
  if (!key) return c.json({ success: false, error: 'key is required' }, 400);

  const [existing] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, key)).limit(1);
  if (existing) {
    await db.update(adminSettings).set({ value }).where(eq(adminSettings.id, existing.id));
  } else {
    await db.insert(adminSettings).values({ settingKey: key, value });
  }

  return c.json({ success: true, message: 'Setting saved' });
});

// ─── Payments Management ─────────────────────────────────────────────
adminModule.get('/payments', async (c) => {
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
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(payments.createdAt));

    let totalSettled = 0;
    let pendingCount = 0;
    let successfulCount = 0;
    let refundedVolume = 0;

    allPayments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.status === 'paid') {
        totalSettled += amt;
        successfulCount++;
      } else if (p.status === 'pending') {
        pendingCount++;
      } else if (p.status === 'refunded') {
        refundedVolume += amt;
      }
    });

    return c.json({
      success: true,
      data: allPayments.map((p) => ({
        id: p.id,
        order_id: p.orderId,
        order_number: `ORD-${String(p.orderId).padStart(4, '0')}`,
        provider: p.provider,
        reference: p.reference || `REF-${p.id}`,
        amount: Number(p.amount),
        status: p.status,
        order_status: p.orderStatus,
        customer_name: p.customerName || 'Bespoke Client',
        customer_email: p.customerEmail || '',
        created_at: p.createdAt,
        updated_at: p.updatedAt,
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
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminModule.post('/payments', async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, provider, reference, amount, status } = body;

    if (!orderId || !amount) {
      return c.json({ success: false, error: 'orderId and amount are required' }, 400);
    }

    const [inserted] = await db.insert(payments).values({
      orderId: Number(orderId),
      provider: provider || 'Manual / Cash on Delivery',
      reference: reference || `MAN-${Date.now().toString().slice(-6)}`,
      amount: String(amount),
      status: (status as any) || 'paid',
    });

    if (status === 'paid') {
      await db.update(orders).set({ status: 'processing' }).where(eq(orders.id, Number(orderId)));
    }

    const [record] = await db.select().from(payments).where(eq(payments.id, inserted.insertId)).limit(1);
    return c.json({ success: true, data: record, message: 'Payment recorded successfully' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminModule.patch('/payments/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  const { status } = await c.req.json();
  if (!['pending', 'paid', 'failed', 'refunded'].includes(status)) {
    return c.json({ success: false, error: 'Invalid status value' }, 400);
  }

  await db.update(payments).set({ status }).where(eq(payments.id, id));
  const [updated] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return c.json({ success: true, data: updated, message: `Payment status updated to ${status}` });
});
