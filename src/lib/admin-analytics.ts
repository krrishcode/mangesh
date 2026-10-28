export function storeDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
export function adminReportWindow(now = new Date()) {
  const end = new Date(`${storeDateKey(now)}T00:00:00+05:30`);
  const start = new Date(end.getTime() - 29 * 86400000);
  return {
    start,
    end,
    days: Array.from({ length: 30 }, (_, i) =>
      storeDateKey(new Date(start.getTime() + i * 86400000)),
    ),
  };
}
export function buildAdminSeries(
  paymentRows: { amount: string; updatedAt: Date }[],
  orderRows: { createdAt: Date }[],
  now = new Date(),
) {
  const { days } = adminReportWindow(now);
  const rows = new Map(
    days.map((date) => [date, { date, collected: 0, orders: 0 }]),
  );
  for (const payment of paymentRows) {
    const row = rows.get(storeDateKey(payment.updatedAt));
    if (row) row.collected += Math.round(Number(payment.amount) * 100);
  }
  for (const order of orderRows) {
    const row = rows.get(storeDateKey(order.createdAt));
    if (row) row.orders++;
  }
  return [...rows.values()].map((row) => ({
    ...row,
    collected: row.collected / 100,
  }));
}
