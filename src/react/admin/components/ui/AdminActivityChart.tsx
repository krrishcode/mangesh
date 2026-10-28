import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useId } from "react";
import { adminMoney } from "./AdminPage";
export interface ActivityPoint {
  date: string;
  collected: number;
  orders: number;
}
export default function AdminActivityChart({
  data,
  metric,
}: {
  data: ActivityPoint[];
  metric: "collected" | "orders";
}) {
  const id = useId().replaceAll(":", "");
  return (
    <div
      className="admin-chart"
      role="img"
      aria-label={`${metric === "collected" ? "Collected revenue" : "Orders placed"} by day over the last 30 days. ${metric === "collected" ? adminMoney(data.reduce((n, row) => n + row.collected, 0)) : data.reduce((n, row) => n + row.orders, 0)} total.`}
    >
      <ResponsiveContainer
        width="100%"
        height={260}
        minWidth={1}
        initialDimension={{ width: 320, height: 260 }}
      >
        <AreaChart
          data={data}
          margin={{ top: 10, left: 4, right: 4, bottom: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--admin-muted)"
                stopOpacity={0.23}
              />
              <stop
                offset="100%"
                stopColor="var(--admin-muted)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--admin-border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            minTickGap={36}
            tick={{ fill: "var(--admin-muted)", fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.DateTimeFormat("en-IN", {
                month: "short",
                day: "numeric",
              }).format(new Date(value + "T12:00:00Z"))
            }
          />
          <Tooltip
            cursor={{ stroke: "var(--admin-border)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="admin-chart-tooltip">
                  <span>{label}</span>
                  <strong>
                    {metric === "collected"
                      ? adminMoney(Number(payload[0].value))
                      : `${payload[0].value} orders`}
                  </strong>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke="var(--admin-text)"
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
