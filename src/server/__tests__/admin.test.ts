import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const fixture = vi.hoisted(() => ({
  tables: {} as Record<string, any[][]>,
  writes: [] as any[],
  queries: [] as any[],
  nextId: 1000,
  affected: 1,
  insertError: "",
  failAudit: false,
}));

vi.mock("../db", () => {
  const name = (table: any) => table[Symbol.for("drizzle:Name")];
  function chain(rows: any, table = "") {
    const query: any = {
      then: (resolve: any, reject: any) =>
        Promise.resolve(rows).then(resolve, reject),
    };
    for (const method of [
      "limit",
      "orderBy",
      "for",
      "innerJoin",
      "leftJoin",
      "groupBy",
      "onConflictDoUpdate",
    ])
      query[method] = () => query;
    query.returning = () => query;
    query.where = (condition: any) => {
      if (condition)
        fixture.queries.push({
          table,
          ...new PgDialect().sqlToQuery(condition),
        });
      return query;
    };
    return query;
  }
  const db: any = {
    transaction: async (callback: any) => {
      const before = [...fixture.writes];
      try {
        return await callback(db);
      } catch (error) {
        fixture.writes = before;
        throw error;
      }
    },
    select: () => ({
      from: (table: any) =>
        chain(fixture.tables[name(table)]?.shift() || [], name(table)),
    }),
    insert: (table: any) => ({
      values: (payload: any) => {
        if (fixture.failAudit && name(table) === "audit_logs")
          throw new Error("Audit unavailable");
        if (fixture.insertError)
          throw Object.assign(new Error("Fixture duplicate value"), {
            code: fixture.insertError,
          });
        fixture.writes.push({ kind: "insert", table: name(table), payload });
        return chain(
          [{ id: ++fixture.nextId }],
          name(table),
        );
      },
    }),
    update: (table: any) => ({
      set: (payload: any) => {
        fixture.writes.push({ kind: "update", table: name(table), payload });
        return chain(fixture.affected ? [{ id: 1 }] : [], name(table));
      },
    }),
    delete: (table: any) => {
      fixture.writes.push({ kind: "delete", table: name(table) });
      return chain([{ id: 1 }], name(table));
    },
  };
  return { db };
});

vi.mock("../http/auth", async () => {
  const { AppError } = await import("../lib/errors");
  return {
    authenticate: async (request: Request) => {
      const token = request.headers.get("authorization");
      if (!["Bearer admin", "Bearer customer"].includes(token || "")) {
        throw new AppError(401, "Unauthorized: missing bearer token");
      }
      return {
        id: 1,
        email: "admin@example.invalid",
        role: token === "Bearer admin" ? "admin" : "customer",
      };
    },
  };
});

import { handleApi } from "../http/router";
import { resetRateLimits } from "../http/rate-limit";

function request(
  path: string,
  method = "GET",
  body?: unknown,
  token = "admin",
) {
  return handleApi(
    new Request(`http://localhost/api/account${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    path.split("?")[0].split("/").filter(Boolean),
  );
}

beforeEach(() => {
  fixture.tables = {};
  fixture.writes = [];
  fixture.queries = [];
  fixture.nextId = 1000;
  fixture.affected = 1;
  fixture.insertError = "";
  fixture.failAudit = false;
  resetRateLimits();
});

const removal = {
  reason: "Removing an unused test record",
  confirmation: "DELETE",
};
const archive = { reason: "Moving completed work to the archive" };

describe("admin record lifecycle", () => {
  it("keeps appointment calendar writes behind admin auth and validates before inserting", async () => {
    const appointment = {
      customerId: 8,
      location: "Atelier",
      occasion: "Wedding",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      notes: null,
    };
    expect(
      (await request("/admin/appointments", "POST", appointment, "customer"))
        .status,
    ).toBe(403);
    expect(
      (
        await request("/admin/appointments", "POST", {
          ...appointment,
          location: "",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request("/admin/appointments/21/schedule", "PATCH", {
          scheduledAt: "invalid",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(
          "/admin/appointments/21/schedule",
          "PATCH",
          { scheduledAt: new Date(Date.now() + 86400000).toISOString() },
          "customer",
        )
      ).status,
    ).toBe(403);
    expect(fixture.writes).toHaveLength(0);
  });

  it("creates a real appointment for an existing customer and restores the customer's activity listing", async () => {
    fixture.tables.users = [[{ id: 8, role: "customer" }]];
    fixture.tables.admin_record_archives = [
      [{ entityType: "customers", entityId: 8, archivedAt: new Date() }],
    ];
    fixture.tables.appointments = [
      [
        {
          id: 21,
          userId: 8,
          location: "Atelier",
          occasion: "Wedding",
          status: "upcoming",
        },
      ],
    ];
    const response = await request("/admin/appointments", "POST", {
      customerId: 8,
      location: "Atelier",
      occasion: "Wedding",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(response.status).toBe(201);
    expect((await response.json()).data.id).toBe(21);
    expect(fixture.writes).toContainEqual(
      expect.objectContaining({
        kind: "insert",
        table: "appointments",
        payload: expect.objectContaining({ userId: 8, location: "Atelier" }),
      }),
    );
    expect(fixture.writes).toContainEqual(
      expect.objectContaining({
        kind: "delete",
        table: "admin_record_archives",
      }),
    );
  });

  it("reschedules upcoming appointments only", async () => {
    fixture.tables.appointments = [[{ id: 21, status: "upcoming" }]];
    const response = await request("/admin/appointments/21/schedule", "PATCH", {
      scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    });
    expect(response.status).toBe(200);
    expect(fixture.writes).toContainEqual(
      expect.objectContaining({
        kind: "update",
        table: "appointments",
        payload: expect.objectContaining({ scheduledAt: expect.any(Date) }),
      }),
    );

    fixture.tables.appointments = [[{ id: 22, status: "completed" }]];
    fixture.writes = [];
    expect(
      (
        await request("/admin/appointments/22/schedule", "PATCH", {
          scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        })
      ).status,
    ).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it("includes archived payments in accounting totals and exposes their archive state", async () => {
    const archivedAt = new Date("2026-10-25T12:00:00Z");
    fixture.tables.payments = [
      [
        {
          id: 5,
          orderId: 2,
          status: "paid",
          amount: "50",
          orderStatus: "delivered",
        },
      ],
    ];
    fixture.tables.admin_record_archives = [
      [{ entityType: "payments", entityId: 5, archivedAt }],
    ];
    const response = await request("/admin/payments");
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.stats.total_settled).toBe(50);
    expect(result.data[0].lifecycle.archivedAt).toBe(archivedAt.toISOString());
    expect(result.data[0].amount).toBe(50);
    expect(fixture.writes).toHaveLength(0);
  });
  it.each(["", "customer"])(
    "protects lifecycle writes from token %s",
    async (token) => {
      for (const [path, method] of [
        ["/admin/records/orders/5/archive", "POST"],
        ["/admin/records/payments/5/restore", "POST"],
        ["/admin/records/reviews/5", "DELETE"],
        ["/admin/records/products/5/deactivate", "POST"],
      ])
        expect((await request(path, method, removal, token)).status).toBe(
          token ? 403 : 401,
        );
      expect(fixture.writes).toHaveLength(0);
      expect(fixture.queries).toHaveLength(0);
    },
  );

  it.each(["orders", "payments", "customers", "appointments"])(
    "retains %s permanently",
    async (kind) => {
      expect(
        (await request(`/admin/records/${kind}/5`, "DELETE", removal)).status,
      ).toBe(409);
      expect(fixture.writes).toHaveLength(0);
    },
  );

  it("requires a reason, confirmation and valid record before writes", async () => {
    for (const body of [
      undefined,
      {},
      { reason: "x", confirmation: "DELETE" },
      { reason: "Valid reason" },
      { reason: "Valid reason", confirmation: "delete" },
    ]) {
      expect((await request("/admin/products/5", "DELETE", body)).status).toBe(
        400,
      );
    }
    for (const path of [
      "/admin/records/toString/5",
      "/admin/records/products/-1",
      "/admin/records/products/1.5",
    ])
      expect((await request(path, "DELETE", removal)).status).toBe(400);
    expect(
      (await request("/admin/products/999", "DELETE", removal)).status,
    ).toBe(404);
    expect(fixture.writes).toHaveLength(0);
  });

  it.each([
    { isActive: true, orderHistory: false, reviewHistory: false },
    { isActive: false, orderHistory: true, reviewHistory: false },
    { isActive: false, orderHistory: false, reviewHistory: true },
  ])("protects product history %j", async (state) => {
    fixture.tables.products = [[{ id: 5, isActive: state.isActive }]];
    fixture.tables.order_items = [state.orderHistory ? [{ id: 2 }] : []];
    fixture.tables.reviews = [state.reviewHistory ? [{ id: 3 }] : []];
    expect((await request("/admin/products/5", "DELETE", removal)).status).toBe(
      409,
    );
    expect(fixture.writes).toHaveLength(0);
  });

  it("deletes an unused inactive product and wishlist links with its audit", async () => {
    fixture.tables.products = [[{ id: 5, isActive: false }]];
    expect((await request("/admin/products/5", "DELETE", removal)).status).toBe(
      200,
    );
    expect(fixture.writes).toEqual([
      { kind: "delete", table: "wishlist_items" },
      { kind: "delete", table: "products" },
      expect.objectContaining({
        kind: "insert",
        table: "audit_logs",
        payload: expect.objectContaining({
          actorId: 1,
          entityId: 5,
          action: "admin.delete",
        }),
      }),
    ]);
    expect(
      fixture.queries.some(
        (query) => query.table === "wishlist_items" && query.params.includes(5),
      ),
    ).toBe(true);
  });

  it("deactivates a previously purchased product without deleting its history", async () => {
    fixture.tables.products = [[{ id: 5, isActive: true }]];
    fixture.tables.order_items = [[{ id: 2 }]];
    expect(
      (await request("/admin/records/products/5/deactivate", "POST", archive))
        .status,
    ).toBe(200);
    expect(fixture.writes[0]).toMatchObject({
      kind: "update",
      table: "products",
      payload: { isActive: false },
    });
    expect(fixture.writes.every((row) => row.kind !== "delete")).toBe(true);
    expect(fixture.writes[1].payload.action).toBe("admin.deactivate");
  });

  it.each(["pending", "approved"])(
    "requires rejection before deleting a %s review",
    async (status) => {
      fixture.tables.reviews = [[{ id: 5, status }]];
      expect(
        (await request("/admin/reviews/5", "DELETE", removal)).status,
      ).toBe(409);
      expect(fixture.writes).toHaveLength(0);
    },
  );

  it("removes a rejected review and retains an activity record", async () => {
    fixture.tables.reviews = [[{ id: 5, status: "rejected" }]];
    expect((await request("/admin/reviews/5", "DELETE", removal)).status).toBe(
      200,
    );
    expect(fixture.writes.map((row) => row.table)).toEqual([
      "reviews",
      "audit_logs",
    ]);
  });

  it.each([
    ["pending", []],
    ["shipped", []],
    ["delivered", []],
    ["delivered", [{ status: "pending", amount: "100" }]],
    ["cancelled", [{ status: "paid", amount: "100" }]],
  ])("does not archive unresolved order %s %j", async (status, rows) => {
    fixture.tables.orders = [[{ id: 5, status, totalAmount: "100" }]];
    fixture.tables.payments = [rows as any[]];
    expect(
      (await request("/admin/records/orders/5/archive", "POST", archive))
        .status,
    ).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it("archives a settled delivered order without changing accounting or customer data", async () => {
    fixture.tables.orders = [
      [{ id: 5, status: "delivered", totalAmount: "100" }],
    ];
    fixture.tables.payments = [[{ id: 2, status: "paid", amount: "100" }]];
    expect(
      (await request("/admin/records/orders/5/archive", "POST", archive))
        .status,
    ).toBe(200);
    expect(fixture.writes.map((row) => row.table)).toEqual([
      "admin_record_archives",
      "audit_logs",
    ]);
    expect(fixture.writes[0].payload).toMatchObject({
      entityType: "orders",
      entityId: 5,
      actorId: 1,
      reason: archive.reason,
    });
  });

  it.each([
    ["pending", "delivered"],
    ["paid", "shipped"],
  ])("retains an unresolved payment %s on %s", async (status, orderStatus) => {
    fixture.tables.payments = [[{ id: 5, orderId: 2, status }]];
    fixture.tables.orders = [[{ id: 2, status: orderStatus }]];
    expect(
      (await request("/admin/records/payments/5/archive", "POST", archive))
        .status,
    ).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it("archives a settled payment and keeps the financial record", async () => {
    fixture.tables.payments = [[{ id: 5, orderId: 2, status: "paid" }]];
    fixture.tables.orders = [[{ id: 2, status: "delivered" }]];
    expect(
      (await request("/admin/records/payments/5/archive", "POST", archive))
        .status,
    ).toBe(200);
    expect(fixture.writes.map((row) => row.table)).toEqual([
      "admin_record_archives",
      "audit_logs",
    ]);
  });

  it.each(["upcoming", "completed"])(
    "applies appointment archive rule to %s",
    async (status) => {
      fixture.tables.appointments = [[{ id: 5, status }]];
      expect(
        (
          await request(
            "/admin/records/appointments/5/archive",
            "POST",
            archive,
          )
        ).status,
      ).toBe(status === "upcoming" ? 409 : 200);
      expect(fixture.writes.some((row) => row.table === "appointments")).toBe(
        false,
      );
    },
  );

  it.each([
    ["processing", false],
    ["delivered", true],
  ])("keeps active customers visible (%s, visit %s)", async (status, visit) => {
    fixture.tables.users = [[{ id: 5, role: "customer" }]];
    fixture.tables.orders = [[{ status }]];
    fixture.tables.appointments = [visit ? [{ status: "upcoming" }] : []];
    expect(
      (await request("/admin/records/customers/5/archive", "POST", archive))
        .status,
    ).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it("archives an inactive customer without altering their login or purchase history", async () => {
    fixture.tables.users = [[{ id: 5, role: "customer" }]];
    expect(
      (await request("/admin/records/customers/5/archive", "POST", archive))
        .status,
    ).toBe(200);
    expect(fixture.writes.map((row) => row.table)).toEqual([
      "admin_record_archives",
      "audit_logs",
    ]);
  });

  it("cannot archive an administrator through the customer route", async () => {
    fixture.tables.users = [[{ id: 1, role: "admin" }]];
    expect(
      (await request("/admin/records/customers/1/archive", "POST", archive))
        .status,
    ).toBe(404);
    expect(fixture.writes).toHaveLength(0);
  });

  it("restores only the archive pointer and records the actor and reason", async () => {
    fixture.tables.orders = [
      [{ id: 5, status: "cancelled", totalAmount: "100" }],
    ];
    fixture.tables.admin_record_archives = [
      [{ entityType: "orders", entityId: 5 }],
    ];
    expect(
      (await request("/admin/records/orders/5/restore", "POST", archive))
        .status,
    ).toBe(200);
    expect(fixture.writes.map((row) => row.table)).toEqual([
      "admin_record_archives",
      "audit_logs",
    ]);
    expect(fixture.writes[1].payload.action).toBe("admin.restore");
  });

  it("does not duplicate an archive or its activity on a repeated request", async () => {
    fixture.tables.appointments = [[{ id: 5, status: "cancelled" }]];
    fixture.tables.admin_record_archives = [
      [{ entityType: "appointments", entityId: 5 }],
    ];
    expect(
      (await request("/admin/records/appointments/5/archive", "POST", archive))
        .status,
    ).toBe(200);
    expect(fixture.writes).toHaveLength(0);
  });

  it("rolls back permanent deletion when its audit record cannot be saved", async () => {
    fixture.tables.reviews = [[{ id: 5, status: "rejected" }]];
    fixture.failAudit = true;
    expect((await request("/admin/reviews/5", "DELETE", removal)).status).toBe(
      500,
    );
    expect(fixture.writes).toHaveLength(0);
  });
});

describe("admin authorization", () => {
  it("protects and validates the ecommerce overview endpoint", async () => {
    expect(
      (await request("/admin/overview", "GET", undefined, "")).status,
    ).toBe(401);
    expect(
      (await request("/admin/overview", "GET", undefined, "customer")).status,
    ).toBe(403);
    expect((await request("/admin/overview?period=invalid")).status).toBe(400);
    expect((await request("/admin/overview?channel=invalid")).status).toBe(400);
    expect(fixture.queries).toHaveLength(0);
    expect(fixture.writes).toHaveLength(0);
  });
  it("returns connected empty overview data for valid period and channel filters", async () => {
    const response = await request(
      "/admin/overview?period=month&channel=pickup",
    );
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data).toMatchObject({
      period: "month",
      channel: "pickup",
      current: { orders: 0, collected: 0 },
      reviews: { average: null },
    });
    expect(data.series.length).toBeGreaterThan(0);
    expect(fixture.writes).toHaveLength(0);
  });
  it("rejects anonymous and customer access before touching the database", async () => {
    expect(
      (await request("/admin/dashboard", "GET", undefined, "")).status,
    ).toBe(401);
    expect(
      (await request("/admin/dashboard", "GET", undefined, "customer")).status,
    ).toBe(403);
    expect(fixture.queries).toHaveLength(0);
    expect(fixture.writes).toHaveLength(0);
  });
});

describe("admin dashboard and catalogue management", () => {
  it("returns aggregate stats and recent orders", async () => {
    const now = new Date();
    fixture.tables.products = [
      [{ value: 5 }],
      [{ value: 2 }],
      [{ id: 4, title: "Low-stock piece", stock: 1 }],
    ];
    fixture.tables.orders = [
      [{ value: 3 }],
      [{ value: 1 }],
      [
        {
          id: 11,
          userId: null,
          totalAmount: "100.00",
          status: "pending",
          createdAt: new Date("2026-01-05T00:00:00Z"),
          customerName: "Guest Buyer",
          customerEmail: "guest@example.invalid",
        },
      ],
      [{ createdAt: now }],
      [{ status: "pending", value: 3 }],
    ];
    fixture.tables.users = [[{ value: 2 }]];
    fixture.tables.payments = [
      [{ value: "250.00" }],
      [{ amount: "25.50", updatedAt: now }],
    ];
    fixture.tables.order_items = [
      [{ id: 4, title: "Top piece", units: "2", amount: "51.00" }],
    ];
    fixture.tables.reviews = [[{ status: "pending", value: 2 }]];

    const response = await request("/admin/dashboard");
    expect(response.status).toBe(200);
    const data = (await response.json()).data;
    expect(data.stats).toEqual({
      totalProducts: 5,
      totalOrders: 3,
      totalCustomers: 2,
      totalRevenue: 250,
      pendingOrders: 1,
      lowStockItems: 2,
    });
    expect(data.recentOrders[0]).toMatchObject({
      order_number: "ORD-0011",
      customer_name: "Guest Buyer",
      total_amount: 100,
      status: "pending",
    });
    expect(data.activity).toHaveLength(30);
    expect(data.activity.at(-1)).toMatchObject({ collected: 25.5, orders: 1 });
    expect(data.lowStockProducts[0].stock).toBe(1);
    expect(data.orderStatuses).toEqual([{ status: "pending", count: 3 }]);
    expect(data.reviewSummary).toEqual([{ status: "pending", count: 2 }]);
    expect(data.topProducts[0]).toMatchObject({
      title: "Top piece",
      units: 2,
      amount: 51,
    });
  });

  it("rejects incomplete product creation without writing", async () => {
    const response = await request("/admin/products", "POST", {
      title: "Only a title",
    });
    expect(response.status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it("creates a product with serialized variants and defaults", async () => {
    fixture.tables.products = [[{ id: 1001, title: "Fixture Product" }]];
    fixture.tables.categories = [[{ id: 2 }]];
    const response = await request("/admin/products", "POST", {
      title: "Fixture Product",
      slug: "fixture-product",
      price: 100,
      sku: "MM-1",
      stock: 4,
      categoryId: 2,
      isActive: false,
      sizes: ["M", "L"],
      gallery: ["https://example.com/a.jpg"],
    });
    expect(response.status).toBe(201);
    const write = fixture.writes.find(
      (entry) => entry.table === "products" && entry.kind === "insert",
    );
    expect(write.payload).toMatchObject({
      title: "Fixture Product",
      slug: "fixture-product",
      price: "100",
      sku: "MM-1",
      stock: 4,
      categoryId: 2,
      isActive: false,
      sizes: '["M","L"]',
      gallery: '["https://example.com/a.jpg"]',
      componentsCount: null,
      countryOfOrigin: null,
      deliveryMethod: "both",
    });
  });

  it("updates only supplied product fields", async () => {
    fixture.tables.products = [
      [{ id: 8, title: "Original", price: "100.00", sizes: '["L"]' }],
      [{ id: 8, title: "Updated", sizes: '["L"]' }],
    ];
    const response = await request("/admin/products/8", "PUT", {
      title: "Updated",
      sizes: ["L"],
      salePrice: null,
    });
    expect(response.status).toBe(200);
    expect(fixture.writes[0].payload).toEqual({
      title: "Updated",
      sizes: '["L"]',
      salePrice: null,
    });
  });
});

describe("admin operations", () => {
  it.each([
    { price: -10 },
    { price: "100.001" },
    { stock: -1 },
    { stock: 1.5 },
    { isActive: "false" },
    { salePrice: 120 },
    { gallery: ["javascript:alert(1)"] },
    { colorVariants: [{ color: "Blue", sizes: ["M"], inStockSizes: ["L"] }] },
  ])("rejects invalid product data before writing: %j", async (patch) => {
    const response = await request("/admin/products", "POST", {
      title: "Product",
      slug: "product",
      sku: "SKU-1",
      price: 100,
      ...patch,
    });
    expect(response.status).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it("returns a useful conflict when a SKU or slug is already used", async () => {
    fixture.insertError = "23505";
    const response = await request("/admin/products", "POST", {
      title: "Product",
      slug: "product",
      sku: "SKU-1",
      price: 100,
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("already in use");
  });

  it("rejects sale prices above an existing product price", async () => {
    fixture.tables.products = [[{ id: 8, price: "100.00", salePrice: null }]];
    expect(
      (await request("/admin/products/8", "PUT", { salePrice: 120 })).status,
    ).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it("does not update an unknown product or assign a missing category", async () => {
    expect(
      (await request("/admin/products/99", "PUT", { title: "Unknown" })).status,
    ).toBe(404);
    expect(
      (
        await request("/admin/products", "POST", {
          title: "Product",
          slug: "product",
          sku: "SKU-1",
          price: 100,
          categoryId: 900,
        })
      ).status,
    ).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it("prevents category removal while products are assigned", async () => {
    fixture.tables.categories = [[{ id: 2 }]];
    fixture.tables.products = [[{ id: 7 }]];
    expect(
      (
        await request("/admin/categories/2", "DELETE", {
          reason: "Catalogue cleanup",
          confirmation: "DELETE",
        })
      ).status,
    ).toBe(409);
    expect(fixture.writes).toHaveLength(0);
  });

  it("removes an empty category", async () => {
    fixture.tables.categories = [[{ id: 2 }]];
    fixture.tables.products = [[]];
    expect(
      (
        await request("/admin/categories/2", "DELETE", {
          reason: "Catalogue cleanup",
          confirmation: "DELETE",
        })
      ).status,
    ).toBe(200);
    expect(fixture.writes[0]).toMatchObject({
      kind: "delete",
      table: "categories",
    });
  });

  it("rejects backwards fulfilment and concurrent status changes", async () => {
    fixture.tables.orders = [[{ id: 5, status: "shipped" }]];
    expect(
      (
        await request("/admin/orders/5/status", "PATCH", {
          status: "processing",
        })
      ).status,
    ).toBe(409);
    expect(fixture.writes).toHaveLength(0);
    fixture.tables.orders = [[{ id: 5, status: "processing" }]];
    fixture.affected = 0;
    expect(
      (await request("/admin/orders/5/status", "PATCH", { status: "shipped" }))
        .status,
    ).toBe(409);
  });

  it("does not reopen completed appointments or moderate missing reviews", async () => {
    fixture.tables.appointments = [[{ id: 3, status: "completed" }]];
    expect(
      (
        await request("/admin/appointments/3/status", "PATCH", {
          status: "upcoming",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await request("/admin/reviews/99/status", "PATCH", {
          status: "approved",
        })
      ).status,
    ).toBe(404);
    expect(fixture.writes).toHaveLength(0);
  });

  it("rejects invalid order statuses and reopening cancelled orders", async () => {
    expect(
      (await request("/admin/orders/5/status", "PATCH", { status: "bogus" }))
        .status,
    ).toBe(400);
    expect(fixture.writes).toHaveLength(0);

    fixture.tables.orders = [[{ id: 5, status: "cancelled" }]];
    expect(
      (await request("/admin/orders/5/status", "PATCH", { status: "shipped" }))
        .status,
    ).toBe(409);
    expect(fixture.writes).toHaveLength(0);

    fixture.tables.orders = [[{ id: 5, status: "pending" }]];
    expect(
      (await request("/admin/orders/5/status", "PATCH", { status: "shipped" }))
        .status,
    ).toBe(200);
    expect(fixture.writes[0].payload).toEqual({ status: "shipped" });
  });

  it("upserts supported settings and rejects unknown keys", async () => {
    fixture.tables.admin_settings = [[]];
    expect(
      (
        await request("/admin/settings", "PUT", {
          key: "shipping_flat_rate",
          value: "99",
        })
      ).status,
    ).toBe(200);
    expect(fixture.writes[0]).toMatchObject({
      kind: "insert",
      table: "admin_settings",
      payload: { settingKey: "shipping_flat_rate", value: "99" },
    });

    expect(
      (
        await request("/admin/settings", "PUT", {
          key: "shipping_flat_rate",
          value: "149",
        })
      ).status,
    ).toBe(200);
    expect(fixture.writes[1]).toMatchObject({
      kind: "insert",
      payload: { settingKey: "shipping_flat_rate", value: "149" },
    });
    expect(
      (
        await request("/admin/settings", "PUT", {
          key: "shipping_fee",
          value: "99",
        })
      ).status,
    ).toBe(400);
  });

  it("requires name and slug to create a category", async () => {
    expect(
      (await request("/admin/categories", "POST", { name: "Kurtas" })).status,
    ).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });

  it("creates a category and returns it", async () => {
    fixture.tables.categories = [[{ id: 2, name: "Kurtas", slug: "kurtas" }]];
    const response = await request("/admin/categories", "POST", {
      name: "Kurtas",
      slug: "kurtas",
    });
    expect(response.status).toBe(201);
    expect(fixture.writes[0]).toMatchObject({
      kind: "insert",
      table: "categories",
      payload: { name: "Kurtas", slug: "kurtas", description: null },
    });
  });

  it("returns an empty payment view with zeroed stats", async () => {
    fixture.tables.payments = [[]];
    const response = await request("/admin/payments");
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data).toEqual([]);
    expect(result.stats).toMatchObject({ total_count: 0, total_settled: 0 });
  });

  it("rejects invalid manual payment payloads", async () => {
    expect(
      (
        await request("/admin/payments", "POST", {
          orderId: 5,
          amount: -1,
          status: "paid",
        })
      ).status,
    ).toBe(400);
    expect(fixture.writes).toHaveLength(0);
  });
});
