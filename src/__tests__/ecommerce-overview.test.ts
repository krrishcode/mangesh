import { describe, expect, it } from "vitest";
import {
  buildEcommerceOverview,
  overviewRange,
  type OverviewInputs,
  type OverviewOrder,
} from "../lib/ecommerce-overview";
const now = new Date("2026-10-25T15:00:00Z");
const currentDate = new Date("2026-10-10T10:00:00Z");
const oldDate = new Date("2026-09-10T10:00:00Z");
function input(): OverviewInputs {
  return {
    orders: [],
    payments: [],
    products: [],
    lines: [],
    customers: [],
    reviews: [],
    lowStockThreshold: 5,
  };
}
const order = (
  id: number,
  fulfilment: string | null,
  amount: string,
  status = "delivered",
  createdAt = currentDate,
): OverviewOrder => ({
  id,
  fulfilment,
  totalAmount: amount,
  status,
  createdAt,
  customerName: "Buyer",
  paymentStatus: "paid",
  itemsCount: 1,
});
describe("ecommerce overview", () => {
  it("builds complete store calendar ranges across year changes and leap months", () => {
    const january = overviewRange(
      "last-month",
      new Date("2027-01-10T00:00:00Z"),
    );
    expect(january.start.toISOString()).toBe("2026-11-30T18:30:00.000Z");
    expect(january.end.toISOString()).toBe("2026-12-31T18:30:00.000Z");
    expect(january.days).toBe(31);
    expect(
      overviewRange("last-month", new Date("2028-03-10T00:00:00Z")).days,
    ).toBe(29);
  });
  it("returns honest zero states and no invented trend or review rating", () => {
    const result = buildEcommerceOverview(input(), "90d", "all", now);
    expect(result.current).toEqual({
      collected: 0,
      orders: 0,
      customers: 0,
      averageOrder: 0,
      refunds: 0,
      orderValue: 0,
    });
    expect(result.series).toHaveLength(45);
    expect(result.reviews.average).toBeNull();
    expect(result.topProducts).toEqual([]);
    expect(result.inventory.healthyPercent).toBe(0);
    expect(result.orderStatuses.every((row) => row.share === 0)).toBe(true);
  });
  it("filters delivery channels and periods without affecting actual inventory", () => {
    const data = input();
    data.orders = [
      order(1, "home", "100"),
      order(2, "pickup", "200"),
      order(3, null, "300"),
      order(4, "home", "50", "delivered", oldDate),
    ];
    data.payments = [
      {
        amount: "100",
        status: "paid",
        fulfilment: "home",
        updatedAt: currentDate,
      },
      {
        amount: "200",
        status: "paid",
        fulfilment: "pickup",
        updatedAt: currentDate,
      },
    ];
    data.products = [{ id: 1, title: "Piece", isActive: true, stock: 10 }];
    const result = buildEcommerceOverview(data, "month", "home", now);
    expect(result.current.orders).toBe(1);
    expect(result.current.collected).toBe(100);
    expect(result.recentOrders.map((row) => row.id)).toEqual([1]);
    expect(result.inventory.healthy).toBe(1);
    expect(
      buildEcommerceOverview(data, "month", "legacy", now).current.orders,
    ).toBe(1);
  });
  it("separates placed order value, cancelled orders, paid collections and refunds", () => {
    const data = input();
    data.orders = [
      order(1, "home", "100"),
      order(2, "home", "200", "cancelled"),
      order(3, "home", "50", "pending"),
    ];
    data.payments = [
      {
        amount: "100",
        status: "paid",
        fulfilment: "home",
        updatedAt: currentDate,
      },
      {
        amount: "200",
        status: "refunded",
        fulfilment: "home",
        updatedAt: currentDate,
      },
      {
        amount: "50",
        status: "pending",
        fulfilment: "home",
        updatedAt: currentDate,
      },
    ];
    const result = buildEcommerceOverview(data, "month", "all", now);
    expect(result.current).toMatchObject({
      orders: 3,
      collected: 100,
      refunds: 1,
      orderValue: 150,
      averageOrder: 75,
    });
    expect(result.series.reduce((sum, row) => sum + row.ordered, 0)).toBe(150);
    expect(result.series.reduce((sum, row) => sum + row.cancelled, 0)).toBe(1);
    expect(
      result.orderStatuses.find((row) => row.status === "cancelled")?.count,
    ).toBe(1);
  });
  it("calculates merchandise shares and excludes cancelled lines", () => {
    const data = input();
    data.lines = [
      {
        productId: 1,
        title: "Kurta",
        categoryName: "Kurtas",
        amount: "100",
        quantity: 2,
        createdAt: currentDate,
        status: "delivered",
        fulfilment: "home",
      },
      {
        productId: 2,
        title: "Jacket",
        categoryName: "Jackets",
        amount: "300",
        quantity: 1,
        createdAt: currentDate,
        status: "shipped",
        fulfilment: "home",
      },
      {
        productId: 3,
        title: "Cancelled",
        categoryName: null,
        amount: "999",
        quantity: 1,
        createdAt: currentDate,
        status: "cancelled",
        fulfilment: "home",
      },
    ];
    const result = buildEcommerceOverview(data, "month", "all", now);
    expect(result.topProducts.map((row) => row.title)).toEqual([
      "Jacket",
      "Kurta",
    ]);
    expect(result.topProducts[0]).toMatchObject({ amount: 300, share: 75 });
    expect(result.categories).toEqual([
      { name: "Jackets", share: 75 },
      { name: "Kurtas", share: 25 },
    ]);
    expect(result.topProductShare).toBe(100);
  });
  it("counts stock health at the configured boundary and uses approved reviews for ratings", () => {
    const data = input();
    data.products = [
      { id: 1, title: "Healthy", isActive: true, stock: 6 },
      { id: 2, title: "Low", isActive: true, stock: 5 },
      { id: 3, title: "Out", isActive: true, stock: 0 },
      { id: 4, title: "Hidden", isActive: false, stock: 50 },
    ];
    data.reviews = [
      {
        id: 1,
        rating: 4,
        title: null,
        body: "Useful",
        status: "approved",
        createdAt: currentDate,
        customerName: "Buyer",
      },
      {
        id: 2,
        rating: 1,
        title: null,
        body: null,
        status: "pending",
        createdAt: currentDate,
        customerName: "Buyer",
      },
    ];
    const result = buildEcommerceOverview(data, "month", "all", now);
    expect(result.inventory).toEqual({
      healthy: 1,
      low: 1,
      out: 1,
      total: 3,
      healthyPercent: 33,
    });
    expect(result.reviews).toMatchObject({ total: 2, pending: 1, average: 4 });
    expect(result.reviews.latest.map((row) => row.id)).toEqual([1]);
  });
  it("sums paise exactly and retains previous-period comparison totals", () => {
    const data = input();
    data.payments = [
      {
        amount: "0.10",
        status: "paid",
        fulfilment: "home",
        updatedAt: currentDate,
      },
      {
        amount: "0.20",
        status: "paid",
        fulfilment: "home",
        updatedAt: currentDate,
      },
      {
        amount: "50",
        status: "paid",
        fulfilment: "home",
        updatedAt: new Date("2026-09-30T10:00:00Z"),
      },
    ];
    const result = buildEcommerceOverview(data, "month", "all", now);
    expect(result.current.collected).toBe(0.3);
    expect(result.previous.collected).toBe(50);
    expect(result.series.reduce((sum, row) => sum + row.collected, 0)).toBe(
      0.3,
    );
  });
});
