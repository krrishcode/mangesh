export const ADMIN_RECORDS = {
  products: "product",
  categories: "category",
  orders: "order",
  payments: "payment",
  customers: "customer",
  appointments: "appointment",
  reviews: "review",
} as const;
export type AdminRecordKind = keyof typeof ADMIN_RECORDS;
export type AdminRecordAction =
  | "archive"
  | "restore"
  | "delete"
  | "activate"
  | "deactivate";
export interface RecordLifecycle {
  archivedAt: string | null;
  archiveBlocked: string | null;
  deleteBlocked: string | null;
  supportsArchive: boolean;
  supportsDelete: boolean;
}

export function recordPolicy(
  kind: AdminRecordKind,
  row: Record<string, any>,
): Omit<RecordLifecycle, "archivedAt"> {
  let archiveBlocked: string | null = null;
  let deleteBlocked: string | null = null;
  const supportsArchive = [
    "orders",
    "payments",
    "customers",
    "appointments",
  ].includes(kind);
  const supportsDelete = ["products", "categories", "reviews"].includes(kind);
  if (kind === "products") {
    if (row.isActive)
      deleteBlocked = "Deactivate this product before deleting it.";
    else if (Number(row.hasOrderHistory) || Number(row.hasReviewHistory))
      deleteBlocked =
        "This product has order or review history. Keep it inactive to preserve those records.";
  }
  if (kind === "categories" && Number(row.productCount))
    deleteBlocked = "Move the products in this category before deleting it.";
  if (kind === "reviews" && row.status !== "rejected")
    deleteBlocked = "Reject this review before permanently deleting it.";
  if (kind === "orders") {
    if (!["delivered", "cancelled"].includes(row.status))
      archiveBlocked = "Only delivered or cancelled orders can be archived.";
    else if (
      Number(row.hasPendingPayments) ||
      (row.status === "delivered" &&
        Math.round(Number(row.collectedAmount) * 100) +
          Math.round(Number(row.refundedAmount) * 100) <
          Math.round(Number(row.totalAmount) * 100))
    )
      archiveBlocked =
        "Resolve outstanding collections before archiving this order.";
    else if (row.status === "cancelled" && Number(row.collectedAmount) > 0)
      archiveBlocked =
        "Record the refund before archiving this cancelled order.";
  }
  if (
    kind === "payments" &&
    (row.status === "pending" ||
      !["delivered", "cancelled"].includes(row.orderStatus))
  )
    archiveBlocked =
      "Resolve this payment and close its order before archiving it.";
  if (
    kind === "customers" &&
    (Number(row.activeOrders) || Number(row.upcomingAppointments))
  )
    archiveBlocked =
      "Complete this customer's active orders and upcoming appointments first.";
  if (kind === "appointments" && row.status === "upcoming")
    archiveBlocked = "Complete or cancel this appointment before archiving it.";
  return { supportsArchive, supportsDelete, archiveBlocked, deleteBlocked };
}
