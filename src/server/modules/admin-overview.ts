import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  categories,
  guestOrderDetails,
  orderCheckoutDetails,
  orderItems,
  orders,
  payments,
  products,
  reviews,
  users,
} from "../db/schema";
import {
  buildEcommerceOverview,
  overviewRange,
} from "../../lib/ecommerce-overview";
import { getStoreSettings } from "../lib/store-settings";
import { json, type ApiContext } from "../http/context";
const options = z.object({
  period: z.enum(["month", "last-month", "90d", "12m"]).default("90d"),
  channel: z.enum(["all", "home", "pickup", "legacy"]).default("all"),
});
export async function adminEcommerceOverview(c: ApiContext) {
  const parsed = options.safeParse(Object.fromEntries(c.url.searchParams));
  if (!parsed.success)
    return json(
      c,
      {
        success: false,
        error: "Choose a valid reporting period and delivery channel.",
      },
      400,
    );
  try {
    const now = new Date();
    const range = overviewRange(parsed.data.period, now);
    const { policy } = await getStoreSettings();
    const [
      orderRows,
      paymentRows,
      productRows,
      lineRows,
      customerRows,
      reviewRows,
    ] = await Promise.all([
      db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          status: orders.status,
          createdAt: orders.createdAt,
          fulfilment: orderCheckoutDetails.fulfilment,
          customerName: sql<
            string | null
          >`coalesce(${users.name},${guestOrderDetails.name})`,
          paymentStatus: sql<
            string | null
          >`(select p.status from payments p where p.order_id = ${orders.id} order by p.created_at desc, p.id desc limit 1)`,
          itemsCount: sql<number>`coalesce((select sum(oi.quantity) from order_items oi where oi.order_id = ${orders.id}),0)`,
        })
        .from(orders)
        .leftJoin(
          orderCheckoutDetails,
          eq(orderCheckoutDetails.orderId, orders.id),
        )
        .leftJoin(users, eq(users.id, orders.userId))
        .leftJoin(guestOrderDetails, eq(guestOrderDetails.orderId, orders.id))
        .where(
          and(
            gte(orders.createdAt, range.previousStart),
            lt(orders.createdAt, range.end),
          ),
        ),
      db
        .select({
          amount: payments.amount,
          status: payments.status,
          updatedAt: payments.updatedAt,
          fulfilment: orderCheckoutDetails.fulfilment,
        })
        .from(payments)
        .leftJoin(
          orderCheckoutDetails,
          eq(orderCheckoutDetails.orderId, payments.orderId),
        )
        .where(
          and(
            gte(payments.updatedAt, range.previousStart),
            lt(payments.updatedAt, range.end),
          ),
        ),
      db
        .select({
          id: products.id,
          title: products.title,
          stock: products.stock,
          isActive: products.isActive,
        })
        .from(products),
      db
        .select({
          productId: orderItems.productId,
          title: orderItems.title,
          categoryName: categories.name,
          amount: sql<string>`(${orderItems.price} * ${orderItems.quantity})`,
          quantity: orderItems.quantity,
          createdAt: orders.createdAt,
          status: orders.status,
          fulfilment: orderCheckoutDetails.fulfilment,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .leftJoin(products, eq(products.id, orderItems.productId))
        .leftJoin(categories, eq(categories.id, products.categoryId))
        .leftJoin(
          orderCheckoutDetails,
          eq(orderCheckoutDetails.orderId, orders.id),
        )
        .where(
          and(
            gte(orders.createdAt, range.start),
            lt(orders.createdAt, range.end),
          ),
        ),
      db
        .select({ createdAt: users.createdAt })
        .from(users)
        .where(
          and(
            eq(users.role, "customer"),
            gte(users.createdAt, range.previousStart),
            lt(users.createdAt, range.end),
          ),
        ),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          body: reviews.body,
          status: reviews.status,
          createdAt: reviews.createdAt,
          customerName: users.name,
        })
        .from(reviews)
        .leftJoin(users, eq(users.id, reviews.userId))
        .where(
          and(
            gte(reviews.createdAt, range.start),
            lt(reviews.createdAt, range.end),
          ),
        )
        .orderBy(desc(reviews.createdAt)),
    ]);
    return json(c, {
      success: true,
      data: buildEcommerceOverview(
        {
          orders: orderRows,
          payments: paymentRows,
          products: productRows,
          lines: lineRows,
          customers: customerRows,
          reviews: reviewRows,
          lowStockThreshold: policy.lowStockThreshold,
        },
        parsed.data.period,
        parsed.data.channel,
        now,
      ),
    });
  } catch {
    return json(
      c,
      {
        success: false,
        error: "Store overview could not be loaded. Please try again.",
      },
      503,
    );
  }
}
