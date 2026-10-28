import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  adminRecordArchives,
  auditLogs,
  appointments,
  categories,
  orderItems,
  orders,
  payments,
  products,
  reviews,
  users,
  wishlistItems,
} from "../db/schema";
import { AppError } from "../lib/errors";
import { json, type ApiContext } from "../http/context";
import {
  ADMIN_RECORDS,
  recordPolicy,
  type AdminRecordKind,
  type AdminRecordAction,
} from "../../lib/admin-records";

export const productLifecycleFields = {
  hasOrderHistory: sql<number>`exists(select 1 from order_items oi where oi.product_id = ${products.id})`,
  hasReviewHistory: sql<number>`exists(select 1 from reviews r where r.product_id = ${products.id})`,
};
export const customerLifecycleFields = {
  activeOrders: sql<number>`exists(select 1 from orders o where o.user_id = ${users.id} and o.status in ('pending','processing','shipped'))`,
  upcomingAppointments: sql<number>`exists(select 1 from appointments a where a.user_id = ${users.id} and a.status = 'upcoming')`,
};
export const orderLifecycleFields = {
  hasPendingPayments: sql<number>`exists(select 1 from payments p where p.order_id = ${orders.id} and p.status = 'pending')`,
  collectedAmount: sql<string>`coalesce((select sum(p.amount) from payments p where p.order_id = ${orders.id} and p.status = 'paid'), 0)`,
  refundedAmount: sql<string>`coalesce((select sum(p.amount) from payments p where p.order_id = ${orders.id} and p.status = 'refunded'), 0)`,
};

export async function withRecordLifecycle<T extends { id: number }>(
  kind: AdminRecordKind,
  rows: T[],
) {
  const archives = ["orders", "payments", "customers", "appointments"].includes(
    kind,
  )
    ? await db
        .select()
        .from(adminRecordArchives)
        .where(eq(adminRecordArchives.entityType, kind))
    : [];
  const byId = new Map(archives.map((row) => [row.entityId, row.archivedAt]));
  return rows.map((row) => ({
    ...row,
    lifecycle: {
      ...recordPolicy(kind, row),
      archivedAt: byId.get(row.id) ?? null,
    },
  }));
}

const changeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Enter a reason of at least 5 characters.")
    .max(500),
  confirmation: z.literal("DELETE").optional(),
});
const tableFor = {
  products,
  categories,
  orders,
  payments,
  customers: users,
  appointments,
  reviews,
};
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function lockedRecord(tx: Tx, kind: AdminRecordKind, id: number) {
  const table = tableFor[kind];
  const [row] = await tx
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1)
    .for("update");
  if (
    !row ||
    (kind === "customers" && "role" in row && row.role !== "customer")
  )
    throw new AppError(404, `${ADMIN_RECORDS[kind]} not found.`);
  const facts: Record<string, any> = { ...row };
  if (kind === "products") {
    const [item] = await tx
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.productId, id))
      .limit(1);
    const [review] = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.productId, id))
      .limit(1);
    facts.hasOrderHistory = Boolean(item);
    facts.hasReviewHistory = Boolean(review);
  } else if (kind === "categories") {
    const [product] = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.categoryId, id))
      .limit(1);
    facts.productCount = product ? 1 : 0;
  } else if (kind === "orders") {
    const rows = await tx
      .select()
      .from(payments)
      .where(eq(payments.orderId, id));
    facts.hasPendingPayments = rows.some((row) => row.status === "pending");
    facts.collectedAmount = rows
      .filter((row) => row.status === "paid")
      .reduce((total, row) => total + Number(row.amount), 0);
    facts.refundedAmount = rows
      .filter((row) => row.status === "refunded")
      .reduce((total, row) => total + Number(row.amount), 0);
  } else if (kind === "payments") {
    const [parent] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, (row as typeof payments.$inferSelect).orderId))
      .limit(1);
    facts.orderStatus = parent?.status;
  } else if (kind === "customers") {
    const customerOrders = await tx
      .select()
      .from(orders)
      .where(eq(orders.userId, id));
    const visits = await tx
      .select()
      .from(appointments)
      .where(eq(appointments.userId, id));
    facts.activeOrders = customerOrders.some((row) =>
      ["pending", "processing", "shipped"].includes(row.status),
    );
    facts.upcomingAppointments = visits.some(
      (row) => row.status === "upcoming",
    );
  }
  return facts;
}

async function changeRecord(
  c: ApiContext,
  action: AdminRecordAction,
  fixedKind?: AdminRecordKind,
) {
  const kind = fixedKind ?? c.params.kind;
  const id = Number(c.params.id);
  if (
    !Object.hasOwn(ADMIN_RECORDS, kind) ||
    !Number.isSafeInteger(id) ||
    id <= 0
  )
    throw new AppError(400, "Choose a valid record.");
  const entity = kind as AdminRecordKind;
  const parsed = changeSchema.safeParse(c.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message);
  if (action === "delete" && parsed.data.confirmation !== "DELETE")
    throw new AppError(400, "Type DELETE to confirm permanent deletion.");
  const policy = recordPolicy(entity, {});
  if (action === "delete" && !policy.supportsDelete)
    throw new AppError(
      409,
      "This history is retained. Archive the record instead of deleting it.",
    );
  const visibilityChange = action === "activate" || action === "deactivate";
  if (visibilityChange && entity !== "products")
    throw new AppError(400, "Only product visibility can be changed here.");
  if (!visibilityChange && action !== "delete" && !policy.supportsArchive)
    throw new AppError(400, "This module does not support archiving.");
  await db.transaction(async (tx) => {
    const row = await lockedRecord(tx, entity, id);
    const current = recordPolicy(entity, row);
    const blocked =
      action === "delete"
        ? current.deleteBlocked
        : action === "archive"
          ? current.archiveBlocked
          : null;
    if (blocked) throw new AppError(409, blocked);
    if (visibilityChange) {
      if (Boolean(row.isActive) === (action === "activate")) return;
      await tx
        .update(products)
        .set({ isActive: action === "activate" })
        .where(eq(products.id, id));
    } else if (action === "delete") {
      if (entity === "products")
        await tx.delete(wishlistItems).where(eq(wishlistItems.productId, id));
      const table = tableFor[entity];
      await tx.delete(table).where(eq(table.id, id));
    } else {
      const key = and(
        eq(adminRecordArchives.entityType, entity),
        eq(adminRecordArchives.entityId, id),
      );
      const [archived] = await tx
        .select()
        .from(adminRecordArchives)
        .where(key)
        .limit(1);
      if ((action === "archive") === Boolean(archived)) return;
      if (action === "archive")
        await tx.insert(adminRecordArchives).values({
          entityType: entity,
          entityId: id,
          actorId: c.authUser!.id,
          reason: parsed.data.reason,
        });
      else await tx.delete(adminRecordArchives).where(key);
    }
    await tx.insert(auditLogs).values({
      actorId: c.authUser!.id,
      action: `admin.${action}`,
      entityType: entity,
      entityId: id,
      details: JSON.stringify({
        reason: parsed.data.reason,
        record: {
          title: row.title,
          name: entity === "categories" ? row.name : undefined,
          sku: row.sku,
          slug: row.slug,
          status: row.status,
          productId: row.productId,
          rating: row.rating,
        },
      }),
    });
  });
  return json(c, { success: true, message: `Record ${action} completed.` });
}

export const adminArchiveRecord = (c: ApiContext) => changeRecord(c, "archive");
export const adminRestoreRecord = (c: ApiContext) => changeRecord(c, "restore");
export const adminDeleteRecord = (c: ApiContext) => changeRecord(c, "delete");
export const adminActivateProduct = (c: ApiContext) =>
  changeRecord(c, "activate", "products");
export const adminDeactivateProduct = (c: ApiContext) =>
  changeRecord(c, "deactivate", "products");
export const deleteProductRecord = (c: ApiContext) =>
  changeRecord(c, "delete", "products");
export const deleteCategoryRecord = (c: ApiContext) =>
  changeRecord(c, "delete", "categories");
export const deleteReviewRecord = (c: ApiContext) =>
  changeRecord(c, "delete", "reviews");
