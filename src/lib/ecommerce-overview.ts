import { storeDateKey } from "./admin-analytics";
export type OverviewPeriod = "month" | "last-month" | "90d" | "12m";
export type OverviewChannel = "all" | "home" | "pickup" | "legacy";
const DAY = 86400000;
export function overviewRange(period: OverviewPeriod, now = new Date()) {
  const today = new Date(`${storeDateKey(now)}T00:00:00+05:30`);
  const [year, month] = storeDateKey(now).split("-").map(Number);
  const monthStart = (offset: number) => {
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    return new Date(`${date.toISOString().slice(0, 10)}T00:00:00+05:30`);
  };
  const end =
    period === "last-month" ? monthStart(0) : new Date(today.getTime() + DAY);
  const start =
    period === "month"
      ? monthStart(0)
      : period === "last-month"
        ? monthStart(-1)
        : period === "12m"
          ? monthStart(-11)
          : new Date(today.getTime() - 89 * DAY);
  const previousStart = new Date(
    start.getTime() - (end.getTime() - start.getTime()),
  );
  return {
    start,
    end,
    previousStart,
    days: Math.round((end.getTime() - start.getTime()) / DAY),
  };
}
export interface OverviewOrder {
  id: number;
  totalAmount: string;
  status: string;
  createdAt: Date;
  fulfilment: string | null;
  customerName: string | null;
  customerEmail?: string | null;
  paymentStatus: string | null;
  itemsCount: number;
}
export interface OverviewPayment {
  amount: string;
  status: string;
  updatedAt: Date;
  fulfilment: string | null;
}
export interface OverviewProduct {
  id: number;
  title: string;
  stock: number;
  isActive: boolean;
}
export interface OverviewLine {
  productId: number | null;
  title: string;
  categoryName: string | null;
  amount: string;
  quantity: number;
  createdAt: Date;
  status: string;
  fulfilment: string | null;
}
export interface OverviewReview {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: Date;
  customerName: string | null;
}
export interface OverviewInputs {
  orders: OverviewOrder[];
  payments: OverviewPayment[];
  products: OverviewProduct[];
  lines: OverviewLine[];
  customers: { createdAt: Date }[];
  reviews: OverviewReview[];
  lowStockThreshold: number;
}
const cents = (value: string) => Math.round(Number(value) * 100);
export function buildEcommerceOverview(
  input: OverviewInputs,
  period: OverviewPeriod,
  channel: OverviewChannel,
  now = new Date(),
) {
  const range = overviewRange(period, now);
  const inRange = (date: Date, previous = false) =>
    date >= (previous ? range.previousStart : range.start) &&
    date < (previous ? range.start : range.end);
  const inChannel = (value: string | null) =>
    channel === "all" || (channel === "legacy" ? !value : value === channel);
  const orders = input.orders.filter((row) => inChannel(row.fulfilment));
  const payments = input.payments.filter((row) => inChannel(row.fulfilment));
  function metrics(previous = false) {
    const rows = orders.filter((row) => inRange(row.createdAt, previous));
    const paymentRows = payments.filter((row) =>
      inRange(row.updatedAt, previous),
    );
    const valid = rows.filter((row) => row.status !== "cancelled");
    return {
      collected:
        paymentRows
          .filter((row) => row.status === "paid")
          .reduce((sum, row) => sum + cents(row.amount), 0) / 100,
      orders: rows.length,
      customers: input.customers.filter((row) =>
        inRange(row.createdAt, previous),
      ).length,
      averageOrder: valid.length
        ? valid.reduce((sum, row) => sum + cents(row.totalAmount), 0) /
          valid.length /
          100
        : 0,
      refunds: paymentRows.filter((row) => row.status === "refunded").length,
      orderValue:
        valid.reduce((sum, row) => sum + cents(row.totalAmount), 0) / 100,
    };
  }
  const current = metrics();
  const previous = metrics(true);
  const activeProducts = input.products.filter((row) => row.isActive);
  const inventory = {
    healthy: activeProducts.filter((row) => row.stock > input.lowStockThreshold)
      .length,
    low: activeProducts.filter(
      (row) => row.stock > 0 && row.stock <= input.lowStockThreshold,
    ).length,
    out: activeProducts.filter((row) => row.stock <= 0).length,
    total: activeProducts.length,
    healthyPercent: activeProducts.length
      ? Math.round(
          (activeProducts.filter((row) => row.stock > input.lowStockThreshold)
            .length /
            activeProducts.length) *
            100,
        )
      : 0,
  };
  const points = new Map<
    string,
    {
      date: string;
      collected: number;
      ordered: number;
      orders: number;
      cancelled: number;
    }
  >();
  const bucketSize = Math.max(1, Math.ceil(range.days / 60));
  for (let i = 0; i < range.days; i += bucketSize) {
    const date = storeDateKey(new Date(range.start.getTime() + i * DAY));
    points.set(date, {
      date,
      collected: 0,
      ordered: 0,
      orders: 0,
      cancelled: 0,
    });
  }
  const pointFor = (date: Date) =>
    points.get(
      storeDateKey(
        new Date(
          range.start.getTime() +
            Math.floor(
              (new Date(`${storeDateKey(date)}T00:00:00+05:30`).getTime() -
                range.start.getTime()) /
                DAY /
                bucketSize,
            ) *
              bucketSize *
              DAY,
        ),
      ),
    );
  const selectedOrders = orders.filter((row) => inRange(row.createdAt));
  for (const order of selectedOrders) {
    const point = pointFor(order.createdAt);
    if (point) {
      point.orders++;
      if (order.status === "cancelled") point.cancelled++;
      else point.ordered += cents(order.totalAmount);
    }
  }
  for (const payment of payments.filter(
    (row) => row.status === "paid" && inRange(row.updatedAt),
  )) {
    const point = pointFor(payment.updatedAt);
    if (point) point.collected += cents(payment.amount);
  }
  const top = new Map<
    string,
    {
      id: number | null;
      title: string;
      category: string;
      amount: number;
      units: number;
    }
  >();
  const categoryTotals = new Map<string, number>();
  for (const line of input.lines.filter(
    (row) =>
      inRange(row.createdAt) &&
      inChannel(row.fulfilment) &&
      row.status !== "cancelled",
  )) {
    const key = `${line.productId}:${line.title}`;
    const amount = cents(line.amount);
    const row = top.get(key) ?? {
      id: line.productId,
      title: line.title,
      category: line.categoryName || "Uncategorised",
      amount: 0,
      units: 0,
    };
    row.amount += amount;
    row.units += Number(line.quantity);
    top.set(key, row);
    categoryTotals.set(
      row.category,
      (categoryTotals.get(row.category) ?? 0) + amount,
    );
  }
  const totalMerchandise = [...top.values()].reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const topProducts = [...top.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((row) => ({
      ...row,
      amount: row.amount / 100,
      share: totalMerchandise ? (row.amount / totalMerchandise) * 100 : 0,
    }));
  const categories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      share: totalMerchandise ? (amount / totalMerchandise) * 100 : 0,
    }));
  const reviewRows = input.reviews.filter((row) => inRange(row.createdAt));
  const approved = reviewRows.filter((row) => row.status === "approved");
  return {
    period,
    channel,
    generatedAt: now.toISOString(),
    range: {
      start: storeDateKey(range.start),
      end: storeDateKey(new Date(range.end.getTime() - DAY)),
      bucketDays: bucketSize,
    },
    current,
    previous,
    inventory,
    series: [...points.values()].map((row) => ({
      ...row,
      collected: row.collected / 100,
      ordered: row.ordered / 100,
    })),
    orderStatuses: [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ].map((status) => ({
      status,
      count: selectedOrders.filter((row) => row.status === status).length,
      share: selectedOrders.length
        ? (selectedOrders.filter((row) => row.status === status).length /
            selectedOrders.length) *
          100
        : 0,
    })),
    topProducts,
    categories,
    topProductShare: topProducts.reduce((sum, row) => sum + row.share, 0),
    reviews: {
      total: reviewRows.length,
      pending: reviewRows.filter((row) => row.status === "pending").length,
      average: approved.length
        ? approved.reduce((sum, row) => sum + row.rating, 0) / approved.length
        : null,
      latest: approved
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    },
    recentOrders: selectedOrders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((row) => ({
        id: row.id,
        order_number: `ORD-${String(row.id).padStart(4, "0")}`,
        customer_name: row.customerName || "Guest customer",
        status: row.status,
        payment_status: row.paymentStatus,
        total_amount: Number(row.totalAmount),
        created_at: row.createdAt.toISOString(),
        items_count: Number(row.itemsCount),
        fulfilment: row.fulfilment,
      })),
  };
}
export type EcommerceOverview = ReturnType<typeof buildEcommerceOverview>;
