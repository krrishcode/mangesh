export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export function canAdvanceOrder(current: string, next: string) {
  const from = ORDER_STATUSES.indexOf(
    current as (typeof ORDER_STATUSES)[number],
  );
  const to = ORDER_STATUSES.indexOf(next as (typeof ORDER_STATUSES)[number]);
  return (
    from >= 0 && to >= from && current !== "cancelled" && next !== "cancelled"
  );
}
export function availableOrderStatuses(
  current: string,
  paymentStatus?: string | null,
) {
  if (current === "cancelled") return ["cancelled"];
  return ORDER_STATUSES.filter((status) =>
    status === "cancelled"
      ? ["pending", "processing"].includes(current) && paymentStatus !== "paid"
      : canAdvanceOrder(current, status),
  );
}
