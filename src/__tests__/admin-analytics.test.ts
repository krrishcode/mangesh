import { describe, expect, it } from "vitest";
import {
  adminReportWindow,
  buildAdminSeries,
  storeDateKey,
} from "../lib/admin-analytics";

describe("admin activity reports", () => {
  it("uses the store's calendar date across UTC midnight and month boundaries", () => {
    const now = new Date("2026-10-31T20:00:00Z");
    expect(storeDateKey(now)).toBe("2026-11-01");
    const window = adminReportWindow(now);
    expect(window.days).toHaveLength(30);
    expect(window.days[0]).toBe("2026-10-03");
    expect(window.days[29]).toBe("2026-11-01");
    expect(window.start.toISOString()).toBe("2026-10-02T18:30:00.000Z");
  });
  it("sums currency in paise, fills missing days and excludes out-of-window rows", () => {
    const now = new Date("2026-11-01T10:00:00Z");
    const series = buildAdminSeries(
      [
        { amount: "0.10", updatedAt: new Date("2026-10-31T20:00:00Z") },
        { amount: "0.20", updatedAt: new Date("2026-11-01T02:00:00Z") },
        { amount: "999", updatedAt: new Date("2026-09-01T02:00:00Z") },
      ],
      [{ createdAt: new Date("2026-10-31T20:00:00Z") }],
      now,
    );
    expect(series.at(-1)).toEqual({
      date: "2026-11-01",
      collected: 0.3,
      orders: 1,
    });
    expect(series[0]).toEqual({ date: "2026-10-03", collected: 0, orders: 0 });
    expect(series.reduce((total, row) => total + row.collected, 0)).toBe(0.3);
  });
});
