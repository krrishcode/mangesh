import { and, count, desc, eq, gte, ne, sql, sum } from "drizzle-orm";
import { db } from "../db";
import {
  adminSettings,
  appointments,
  categories,
  guestOrderDetails,
  orders,
  orderItems,
  payments,
  products,
  reviews,
  users,
} from "../db/schema";
import {
  getStoreSettings,
  settingValidators,
  type StoreSettingKey,
} from "../lib/store-settings";
import { json, type ApiContext } from "../http/context";
import { cancelOrder } from "../lib/order-actions";
import { restoreCustomerForActivity } from "../lib/admin-archive";
import {
  changePaymentStatus,
  manualPaymentSchema,
  paymentStatusSchema,
  recordManualPayment,
} from "../lib/payment-actions";
import { orderData } from "./orders";
import { AppError } from "../lib/errors";
import {
  customerLifecycleFields,
  orderLifecycleFields,
  productLifecycleFields,
  withRecordLifecycle,
  deleteProductRecord,
  deleteCategoryRecord,
} from "./admin-records";
import { canAdvanceOrder } from "../../lib/order-status";
import { adminReportWindow, buildAdminSeries } from "../../lib/admin-analytics";
import {
  adminCategorySchema,
  adminCategoryUpdateSchema,
  adminCreateAppointmentSchema,
  adminCreateProductSchema,
  adminRescheduleAppointmentSchema,
  adminUpdateProductSchema,
  adminValidationMessage,
} from "../validation/admin";

async function adminWrite<T>(write: () => PromiseLike<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    const reason = error as { code?: string; cause?: { code?: string } };
    if (
      reason?.code === "23505" ||
      reason?.cause?.code === "23505"
    )
      throw new AppError(
        409,
        "This SKU or URL slug is already in use. Choose a unique value.",
      );
    throw error;
  }
}

function bodyOf(c: ApiContext): Record<string, any> {
  return (c.body ?? {}) as Record<string, any>;
}

async function assertCategory(
  categoryId: number | null | undefined,
  executor: Pick<typeof db, "select"> = db,
) {
  if (categoryId == null) return;
  const [category] = await executor
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1)
    .for("update");
  if (!category)
    throw new AppError(
      400,
      "Choose an existing category, or leave the product uncategorised.",
    );
}

export async function adminDashboard(c: ApiContext) {
  try {
    const { policy } = await getStoreSettings();
    const [productCount] = await db.select({ value: count() }).from(products);
    const [orderCount] = await db.select({ value: count() }).from(orders);
    const [customerCount] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "customer"));
    const [revenueResult] = await db
      .select({ value: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, "paid"));
    const [pendingOrders] = await db
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const [lowStockCount] = await db
      .select({ value: count() })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stock} <= ${policy.lowStockThreshold}`,
        ),
      );

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

    const now = new Date();
    const { start } = adminReportWindow(now);
    const [
      recentPayments,
      reportOrders,
      orderStatuses,
      inventory,
      topProducts,
      reviewSummary,
    ] = await Promise.all([
      db
        .select({ amount: payments.amount, updatedAt: payments.updatedAt })
        .from(payments)
        .where(
          and(eq(payments.status, "paid"), gte(payments.updatedAt, start)),
        ),
      db
        .select({ createdAt: orders.createdAt })
        .from(orders)
        .where(gte(orders.createdAt, start)),
      db
        .select({ status: orders.status, value: count() })
        .from(orders)
        .groupBy(orders.status),
      db
        .select({
          id: products.id,
          title: products.title,
          sku: products.sku,
          stock: products.stock,
          imageFront: products.imageFront,
        })
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            sql`${products.stock} <= ${policy.lowStockThreshold}`,
          ),
        )
        .orderBy(products.stock, products.id)
        .limit(5),
      db
        .select({
          id: orderItems.productId,
          title: orderItems.title,
          units: sum(orderItems.quantity),
          amount: sql<string>`sum(${orderItems.quantity} * ${orderItems.price})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(ne(orders.status, "cancelled"))
        .groupBy(orderItems.productId, orderItems.title)
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(5),
      db
        .select({ status: reviews.status, value: count() })
        .from(reviews)
        .groupBy(reviews.status),
    ]);

    return json(c, {
      success: true,
      data: {
        activity: buildAdminSeries(recentPayments, reportOrders, now),
        orderStatuses: orderStatuses.map((row) => ({
          status: row.status,
          count: Number(row.value),
        })),
        lowStockProducts: inventory,
        topProducts: topProducts.map((row) => ({
          ...row,
          units: Number(row.units),
          amount: Number(row.amount),
        })),
        reviewSummary: reviewSummary.map((row) => ({
          status: row.status,
          count: Number(row.value),
        })),
        generatedAt: now.toISOString(),
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
          order_number: `ORD-${String(order.id).padStart(4, "0")}`,
          customer_name: order.customerName ?? "Unknown",
          customer_email: order.customerEmail ?? "",
          total_amount: Number(order.totalAmount),
          status: order.status,
          created_at: order.createdAt,
        })),
      },
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "Dashboard could not be loaded. Please try again.",
      },
      503,
    );
  }
}

const productFields = {
  ...productLifecycleFields,
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
    const [allProducts, sales] = await Promise.all([
      db
        .select(productFields)
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .orderBy(desc(products.createdAt)),
      db
        .select({
          productId: orderItems.productId,
          unitsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(ne(orders.status, "cancelled"))
        .groupBy(orderItems.productId),
    ]);
    const unitsSold = new Map(
      sales.map((row) => [Number(row.productId), Number(row.unitsSold || 0)]),
    );
    return json(c, {
      success: true,
      data: await withRecordLifecycle(
        "products",
        allProducts.map((product) => ({
          ...product,
          unitsSold: unitsSold.get(product.id) ?? 0,
        })),
      ),
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "This module could not be loaded. Please try again.",
      },
      503,
    );
  }
}

export async function adminCreateProduct(c: ApiContext) {
  const parsed = adminCreateProductSchema.safeParse(c.body);
  if (!parsed.success)
    return json(
      c,
      { success: false, error: adminValidationMessage(parsed.error) },
      400,
    );
  const body = parsed.data;
  const {
    title,
    slug,
    description,
    price,
    salePrice,
    stock,
    sku,
    categoryId,
    isActive,
    imageFront,
    imageDetail,
    color,
    colorHex,
    craft,
    badge,
    sizes,
    inStockSizes,
    readyToShip,
    editorialStory,
    styleNumber,
    measurements,
    fabricContent,
    componentsCount,
    setIncludes,
    washCare,
    countryOfOrigin,
    manufacturerAddress,
    returnsPolicy,
    disclaimer,
    deliveryMethod,
    colorVariants,
    gallery,
  } = body;

  if (!title || !slug || !price || !sku) {
    return json(
      c,
      { success: false, error: "title, slug, price, and sku are required" },
      400,
    );
  }

  const [header] = await adminWrite(() =>
    db.transaction(async (tx) => {
      await assertCategory(categoryId, tx);
      return tx.insert(products).values({
        title,
        slug,
        description: description ?? null,
        price: String(price),
        salePrice: salePrice ? String(salePrice) : null,
        stock: stock !== undefined ? Number(stock) : 0,
        sku,
        categoryId: categoryId ? Number(categoryId) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : false,
        imageFront: imageFront || null,
        imageDetail: imageDetail || null,
        color: color || null,
        colorHex: colorHex || null,
        craft: craft || null,
        badge: badge || null,
        sizes: sizes == null ? null : JSON.stringify(sizes),
        inStockSizes:
          inStockSizes == null ? null : JSON.stringify(inStockSizes),
        readyToShip: readyToShip !== undefined ? Boolean(readyToShip) : false,
        editorialStory: editorialStory || null,
        styleNumber: styleNumber || null,
        measurements: measurements || null,
        fabricContent: fabricContent || null,
        componentsCount:
          componentsCount == null ? null : Number(componentsCount),
        setIncludes: setIncludes || null,
        washCare: washCare || null,
        countryOfOrigin: countryOfOrigin || null,
        manufacturerAddress: manufacturerAddress || null,
        returnsPolicy: returnsPolicy || null,
        disclaimer: disclaimer || null,
        deliveryMethod: deliveryMethod || "both",
        colorVariants:
          colorVariants == null ? null : JSON.stringify(colorVariants),
        gallery: gallery == null ? null : JSON.stringify(gallery),
      }).returning();
    }),
  );

  const [created] = await db
    .select()
    .from(products)
    .where(eq(products.id, header.id))
    .limit(1);
  return json(
    c,
    { success: true, data: created, message: "Product created" },
    201,
  );
}

export async function adminProduct(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return json(c, { success: false, error: "Invalid product ID" }, 400);
  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!row) return json(c, { success: false, error: "Product not found" }, 404);
  return json(c, { success: true, data: row });
}

export async function adminUpdateProduct(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return json(c, { success: false, error: "Invalid ID" }, 400);

  const parsed = adminUpdateProductSchema.safeParse(c.body);
  if (!parsed.success)
    return json(
      c,
      { success: false, error: adminValidationMessage(parsed.error) },
      400,
    );
  const body = parsed.data;
  return adminWrite(() =>
    db.transaction(async (tx) => {
      if (body.categoryId !== undefined)
        await assertCategory(body.categoryId, tx);
      const [existing] = await tx
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1)
        .for("update");
      if (!existing)
        return json(c, { success: false, error: "Product not found" }, 404);
      const nextPrice = Number(body.price ?? existing.price);
      const nextSale =
        body.salePrice === undefined ? existing.salePrice : body.salePrice;
      if (nextSale != null && Number(nextSale) > nextPrice)
        return json(
          c,
          { success: false, error: "Sale price cannot exceed the base price." },
          400,
        );
      const values: Record<string, unknown> = {};

      if (body.title !== undefined) values.title = body.title;
      if (body.slug !== undefined) values.slug = body.slug;
      if (body.description !== undefined) values.description = body.description;
      if (body.price !== undefined) values.price = String(body.price);
      if (body.salePrice !== undefined)
        values.salePrice = body.salePrice ? String(body.salePrice) : null;
      if (body.stock !== undefined) values.stock = Number(body.stock);
      if (body.sku !== undefined) values.sku = body.sku;
      if (body.categoryId !== undefined)
        values.categoryId = body.categoryId ? Number(body.categoryId) : null;
      if (body.isActive !== undefined) values.isActive = Boolean(body.isActive);

      if (body.imageFront !== undefined)
        values.imageFront = body.imageFront || null;
      if (body.imageDetail !== undefined)
        values.imageDetail = body.imageDetail || null;
      if (body.color !== undefined) values.color = body.color || null;
      if (body.colorHex !== undefined) values.colorHex = body.colorHex || null;
      if (body.craft !== undefined) values.craft = body.craft || null;
      if (body.badge !== undefined) values.badge = body.badge || null;
      if (body.sizes !== undefined)
        values.sizes = body.sizes === null ? null : JSON.stringify(body.sizes);
      if (body.inStockSizes !== undefined)
        values.inStockSizes =
          body.inStockSizes === null ? null : JSON.stringify(body.inStockSizes);
      if (body.readyToShip !== undefined)
        values.readyToShip = Boolean(body.readyToShip);
      if (body.editorialStory !== undefined)
        values.editorialStory = body.editorialStory || null;
      if (body.styleNumber !== undefined)
        values.styleNumber = body.styleNumber || null;
      if (body.measurements !== undefined)
        values.measurements = body.measurements || null;
      if (body.fabricContent !== undefined)
        values.fabricContent = body.fabricContent || null;
      if (body.componentsCount !== undefined)
        values.componentsCount =
          body.componentsCount == null ? null : Number(body.componentsCount);
      if (body.setIncludes !== undefined)
        values.setIncludes = body.setIncludes || null;
      if (body.washCare !== undefined) values.washCare = body.washCare || null;
      if (body.countryOfOrigin !== undefined)
        values.countryOfOrigin = body.countryOfOrigin || null;
      if (body.manufacturerAddress !== undefined)
        values.manufacturerAddress = body.manufacturerAddress || null;
      if (body.returnsPolicy !== undefined)
        values.returnsPolicy = body.returnsPolicy || null;
      if (body.disclaimer !== undefined)
        values.disclaimer = body.disclaimer || null;
      if (body.deliveryMethod !== undefined)
        values.deliveryMethod = body.deliveryMethod || "both";
      if (body.colorVariants !== undefined)
        values.colorVariants =
          body.colorVariants === null
            ? null
            : JSON.stringify(body.colorVariants);
      if (body.gallery !== undefined)
        values.gallery =
          body.gallery === null ? null : JSON.stringify(body.gallery);

      await tx.update(products).set(values).where(eq(products.id, id));
      const [updated] = await tx
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      return json(c, {
        success: true,
        data: updated,
        message: "Product updated",
      });
    }),
  );
}

export async function adminDeleteProduct(c: ApiContext) {
  return deleteProductRecord(c);
}

export async function adminOrders(c: ApiContext) {
  try {
    const allOrders = await db
      .select({
        ...orderLifecycleFields,
        id: orders.id,
        userId: orders.userId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: sql<string>`coalesce(${users.name}, ${guestOrderDetails.name})`,
        customerEmail: sql<string>`coalesce(${users.email}, ${guestOrderDetails.email})`,
        customerPhone: sql<string>`coalesce(${users.phone}, ${guestOrderDetails.phone})`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(guestOrderDetails, eq(orders.id, guestOrderDetails.orderId))
      .orderBy(desc(orders.createdAt));

    const expanded = await orderData(allOrders);

    const data = allOrders.map((order) => ({
      ...order,
      ...expanded.find((entry) => entry.id === order.id),
      id: order.id,
      order_number: `ORD-${String(order.id).padStart(4, "0")}`,
      customer_name: order.customerName ?? "Unknown",
      customer_email: order.customerEmail ?? "",
      customer_phone: order.customerPhone ?? "",
      guest: order.userId === null,
      total_amount: Number(order.totalAmount),
      status: order.status,
      created_at: order.createdAt,
    }));

    return json(c, {
      success: true,
      data: await withRecordLifecycle("orders", data),
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "Orders could not be loaded. Please try again.",
      },
      503,
    );
  }
}

export async function adminUpdateOrderStatus(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return json(c, { success: false, error: "Invalid ID" }, 400);
  const { status } = bodyOf(c);
  const valid = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status))
    return json(c, { success: false, error: "Invalid status" }, 400);

  if (status === "cancelled") {
    await cancelOrder(id);
  } else {
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!existing)
      return json(c, { success: false, error: "Order not found" }, 404);
    if (existing.status === "cancelled") {
      return json(
        c,
        {
          success: false,
          error:
            "A cancelled order cannot be reopened. Create a new order instead.",
        },
        409,
      );
    }
    if (!canAdvanceOrder(existing.status, status))
      return json(
        c,
        { success: false, error: "Order fulfilment cannot move backwards." },
        409,
      );
    if (existing.status === status)
      return json(c, { success: true, message: "Order status unchanged" });
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(and(eq(orders.id, id), eq(orders.status, existing.status))).returning();
    if (!updated)
      return json(
        c,
        {
          success: false,
          error: "This order was updated elsewhere. Refresh and try again.",
        },
        409,
      );
  }
  return json(c, { success: true, message: "Order status updated" });
}

export async function adminCustomers(c: ApiContext) {
  try {
    const allUsers = await db
      .select({
        ...customerLifecycleFields,
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        ordersCount: count(orders.id),
        totalSpent: sql<number>`coalesce((select sum(p.amount) from payments p inner join orders o on p.order_id = o.id where o.user_id = ${users.id} and p.status = 'paid'), 0)`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .where(eq(users.role, "customer"))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return json(c, {
      success: true,
      data: await withRecordLifecycle(
        "customers",
        allUsers.map((user) => ({
          ...user,
          ordersCount: Number(user.ordersCount || 0),
          totalSpent: Number(user.totalSpent || 0),
        })),
      ),
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "This module could not be loaded. Please try again.",
      },
      503,
    );
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
    return json(c, {
      success: true,
      data: await withRecordLifecycle("categories", all),
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "This module could not be loaded. Please try again.",
      },
      503,
    );
  }
}

export async function adminCreateCategory(c: ApiContext) {
  const parsed = adminCategorySchema.safeParse(c.body);
  if (!parsed.success)
    return json(
      c,
      { success: false, error: adminValidationMessage(parsed.error) },
      400,
    );
  const { name, slug, description } = parsed.data;
  const [header] = await adminWrite(() =>
    db
      .insert(categories)
      .values({ name, slug, description: description ?? null }).returning(),
  );
  const [created] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, header.id))
    .limit(1);
  return json(
    c,
    { success: true, data: created, message: "Category created" },
    201,
  );
}

export async function adminUpdateCategory(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return json(c, { success: false, error: "Invalid ID" }, 400);
  const parsed = adminCategoryUpdateSchema.safeParse(c.body);
  if (!parsed.success)
    return json(
      c,
      { success: false, error: adminValidationMessage(parsed.error) },
      400,
    );
  const body = parsed.data;
  return adminWrite(() =>
    db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1)
        .for("update");
      if (!existing)
        return json(c, { success: false, error: "Category not found" }, 404);
      const values: Record<string, unknown> = {};
      if (body.name !== undefined) values.name = body.name;
      if (body.slug !== undefined) values.slug = body.slug;
      if (body.description !== undefined) values.description = body.description;
      await tx.update(categories).set(values).where(eq(categories.id, id));
      return json(c, { success: true, message: "Category updated" });
    }),
  );
}

export async function adminDeleteCategory(c: ApiContext) {
  return deleteCategoryRecord(c);
}

export async function adminAppointments(c: ApiContext) {
  try {
    const all = await db
      .select({
        id: appointments.id,
        customerId: appointments.userId,
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
    return json(c, {
      success: true,
      data: await withRecordLifecycle("appointments", all),
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "This module could not be loaded. Please try again.",
      },
      503,
    );
  }
}

export async function adminCreateAppointment(c: ApiContext) {
  const parsed = adminCreateAppointmentSchema.safeParse(c.body);
  if (!parsed.success)
    return json(
      c,
      { success: false, error: adminValidationMessage(parsed.error) },
      400,
    );
  const body = parsed.data;
  const scheduledAt = new Date(body.scheduledAt);
  if (scheduledAt.getTime() <= Date.now())
    return json(
      c,
      { success: false, error: "Choose a future appointment date and time" },
      400,
    );

  return adminWrite(() =>
    db.transaction(async (tx) => {
      const [customer] = await tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, body.customerId))
        .limit(1)
        .for("update");
      if (!customer || customer.role !== "customer")
        return json(c, { success: false, error: "Customer not found" }, 404);

      const [created] = await tx.insert(appointments).values({
        userId: customer.id,
        location: body.location,
        occasion: body.occasion,
        scheduledAt,
        notes: body.notes ?? null,
      }).returning();
      const [record] = await tx
        .select()
        .from(appointments)
        .where(eq(appointments.id, created.id))
        .limit(1);
      await restoreCustomerForActivity(tx, customer.id);
      return json(
        c,
        { success: true, data: record, message: "Appointment created" },
        201,
      );
    }),
  );
}

export async function adminRescheduleAppointment(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return json(c, { success: false, error: "Invalid appointment ID" }, 400);
  const parsed = adminRescheduleAppointmentSchema.safeParse(c.body);
  if (!parsed.success)
    return json(
      c,
      { success: false, error: adminValidationMessage(parsed.error) },
      400,
    );
  const [existing] = await db
    .select({ id: appointments.id, status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);
  if (!existing)
    return json(c, { success: false, error: "Appointment not found" }, 404);
  if (existing.status !== "upcoming")
    return json(
      c,
      {
        success: false,
        error: "Only upcoming appointments can be rescheduled.",
      },
      409,
    );
  const [updated] = await db
    .update(appointments)
    .set({ scheduledAt: new Date(parsed.data.scheduledAt) })
    .where(and(eq(appointments.id, id), eq(appointments.status, "upcoming"))).returning();
  if (!updated)
    return json(
      c,
      {
        success: false,
        error: "This appointment changed. Refresh and try again.",
      },
      409,
    );
  return json(c, { success: true, message: "Appointment rescheduled" });
}

export async function adminUpdateAppointmentStatus(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return json(c, { success: false, error: "Invalid ID" }, 400);
  const { status } = bodyOf(c);
  const valid = ["upcoming", "completed", "cancelled"];
  if (!valid.includes(status))
    return json(c, { success: false, error: "Invalid status" }, 400);
  const [existing] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);
  if (!existing)
    return json(c, { success: false, error: "Appointment not found" }, 404);
  if (existing.status === status)
    return json(c, { success: true, message: "Appointment status unchanged" });
  if (existing.status !== "upcoming")
    return json(
      c,
      { success: false, error: "Only upcoming appointments can be updated." },
      409,
    );
  const [updated] = await db
    .update(appointments)
    .set({ status })
    .where(and(eq(appointments.id, id), eq(appointments.status, "upcoming"))).returning();
  if (!updated)
    return json(
      c,
      {
        success: false,
        error: "This appointment changed. Refresh and try again.",
      },
      409,
    );
  return json(c, { success: true, message: "Appointment status updated" });
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
    return json(c, {
      success: true,
      data: await withRecordLifecycle("reviews", all),
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "This module could not be loaded. Please try again.",
      },
      503,
    );
  }
}

export async function adminUpdateReviewStatus(c: ApiContext) {
  const id = Number(c.params.id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return json(c, { success: false, error: "Invalid ID" }, 400);
  const { status } = bodyOf(c);
  const valid = ["pending", "approved", "rejected"];
  if (!valid.includes(status))
    return json(c, { success: false, error: "Invalid status" }, 400);
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1)
      .for("update");
    if (!existing)
      return json(c, { success: false, error: "Review not found" }, 404);
    await tx.update(reviews).set({ status }).where(eq(reviews.id, id));
    return json(c, { success: true, message: "Review status updated" });
  });
}

export async function adminGetSettings(c: ApiContext) {
  const { settings, policy } = await getStoreSettings();
  return json(c, {
    success: true,
    data: Object.entries(settings).map(([settingKey, value]) => ({
      settingKey,
      value,
    })),
    policy,
  });
}

export async function adminUpdateSettings(c: ApiContext) {
  const body = bodyOf(c);
  const entries: Record<string, unknown> =
    body.settings &&
    typeof body.settings === "object" &&
    !Array.isArray(body.settings)
      ? body.settings
      : typeof body.key === "string"
        ? { [body.key]: body.value }
        : {};
  if (!Object.keys(entries).length)
    return json(c, { success: false, error: "Choose settings to save." }, 400);
  const validated: { settingKey: string; value: string }[] = [];
  for (const [key, value] of Object.entries(entries)) {
    if (!Object.hasOwn(settingValidators, key))
      return json(
        c,
        { success: false, error: `Unsupported setting: ${key}` },
        400,
      );
    const parsed = settingValidators[key as StoreSettingKey].safeParse(value);
    if (!parsed.success)
      return json(
        c,
        { success: false, error: `${key}: ${parsed.error.issues[0].message}` },
        400,
      );
    validated.push({ settingKey: key, value: parsed.data });
  }
  await db.transaction(async (tx) => {
    for (const value of validated) {
      await tx
        .insert(adminSettings)
        .values(value)
        .onConflictDoUpdate({ target: adminSettings.settingKey, set: { value: value.value } });
    }
  });
  return json(c, { success: true, message: "Settings saved" });
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
      if (payment.status === "paid") {
        totalSettled += amount;
        successfulCount++;
      } else if (payment.status === "pending") {
        pendingCount++;
      } else if (payment.status === "refunded") {
        refundedVolume += amount;
      }
    });

    return json(c, {
      success: true,
      data: await withRecordLifecycle(
        "payments",
        allPayments.map((payment) => ({
          id: payment.id,
          order_id: payment.orderId,
          order_number: `ORD-${String(payment.orderId).padStart(4, "0")}`,
          provider: payment.provider,
          reference: payment.reference,
          amount: Number(payment.amount),
          status: payment.status,
          order_status: payment.orderStatus,
          orderStatus: payment.orderStatus,
          customer_name: payment.customerName,
          customer_email: payment.customerEmail || "",
          created_at: payment.createdAt,
          updated_at: payment.updatedAt,
        })),
      ),
      stats: {
        total_settled: totalSettled,
        successful_count: successfulCount,
        pending_count: pendingCount,
        refunded_volume: refundedVolume,
        total_count: allPayments.length,
      },
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "Payments could not be loaded. Please try again.",
      },
      503,
    );
  }
}

export async function adminRecordPayment(c: ApiContext) {
  const parsed = manualPaymentSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(
      c,
      {
        success: false,
        error:
          "Provide a valid order ID, positive amount, provider and status.",
      },
      400,
    );
  }
  return json(
    c,
    {
      success: true,
      data: await recordManualPayment(parsed.data),
      message: "Payment recorded",
    },
    201,
  );
}

export async function adminUpdatePaymentStatus(c: ApiContext) {
  const id = Number(c.params.id);
  const body = bodyOf(c);
  const parsed = paymentStatusSchema.safeParse(body?.status);
  if (!Number.isSafeInteger(id) || id <= 0 || !parsed.success) {
    return json(
      c,
      { success: false, error: "Provide a valid payment ID and status." },
      400,
    );
  }
  return json(c, {
    success: true,
    data: await changePaymentStatus(id, parsed.data),
    message: "Payment status updated",
  });
}
