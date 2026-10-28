import { describe, expect, it } from "vitest";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  compareValues,
  DataTable,
} from "../react/admin/components/ui/DataTable";
import { availableOrderStatuses, canAdvanceOrder } from "../lib/order-status";
describe("admin table sorting and operational options", () => {
  it.each(["actions", "details"])(
    "exposes %s through an accessible closed row menu",
    (key) => {
      const html = renderToStaticMarkup(
        createElement(DataTable, {
          data: [{ id: 42, title: "Sample product" }],
          columns: [
            { key: "title", label: "Product" },
            {
              key,
              label: "Actions",
              sortable: false,
              render: () =>
                createElement(
                  "div",
                  { className: "admin-page-actions" },
                  createElement("button", { type: "button" }, "Edit"),
                  createElement(
                    Fragment,
                    null,
                    createElement(
                      "button",
                      { type: "button", disabled: true },
                      "Delete",
                    ),
                  ),
                ),
            },
          ],
        }),
      );
      expect(html).toContain('aria-haspopup="menu"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-label="Actions for Sample product"');
      expect(html).not.toContain('role="menuitem"');
      expect(html).toContain('aria-label="Rows per page"');
      expect(html).toContain('aria-label="');
      expect(html).toContain(">Sample product</td>");
    },
  );
  it("sorts decimal price strings by value rather than display text", () => {
    expect(["10.2", "100", "10.12", "2"].sort(compareValues)).toEqual([
      "2",
      "10.12",
      "10.2",
      "100",
    ]);
    expect(compareValues(null, null)).toBe(0);
    expect(compareValues("same", "same")).toBe(0);
  });
  it("allows forward fulfilment and prevents reopening terminal orders", () => {
    expect(canAdvanceOrder("pending", "shipped")).toBe(true);
    expect(canAdvanceOrder("shipped", "processing")).toBe(false);
    expect(canAdvanceOrder("cancelled", "processing")).toBe(false);
    expect(availableOrderStatuses("delivered")).toEqual(["delivered"]);
  });
  it("does not offer cancellation after cash has been collected", () => {
    expect(availableOrderStatuses("pending", "paid")).not.toContain(
      "cancelled",
    );
    expect(availableOrderStatuses("pending", "pending")).toContain("cancelled");
    expect(availableOrderStatuses("shipped", "pending")).not.toContain(
      "cancelled",
    );
  });
});
