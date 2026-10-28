import { useId } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EcommerceOverview } from "../../../../lib/ecommerce-overview";
import { adminMoney } from "./AdminPage";

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(
    new Date(value + "T12:00:00Z"),
  );
export function SalesOverviewChart({
  data,
}: {
  data: EcommerceOverview["series"];
}) {
  return (
    <div
      className="eco-sales-chart"
      role="img"
      aria-label="Sales overview: collected revenue and ordered value over the selected period."
    >
      <ResponsiveContainer
        width="100%"
        height={282}
        minWidth={1}
        initialDimension={{ width: 480, height: 282 }}
      >
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 4, left: 4, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--admin-border)"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={35}
            tickMargin={10}
            tick={{ fill: "var(--admin-muted)", fontSize: 12 }}
            tickFormatter={dateLabel}
          />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip
            cursor={{ stroke: "var(--admin-border)", strokeDasharray: "4 4" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="admin-chart-tooltip">
                  <span>{dateLabel(String(label))}</span>
                  {payload.map((item) => (
                    <strong key={String(item.dataKey)}>
                      <i
                        style={{
                          background:
                            item.dataKey === "ordered"
                              ? "var(--admin-ring)"
                              : "var(--admin-text)",
                        }}
                      />
                      {item.dataKey === "ordered" ? "Order value" : "Collected"}
                      <b>{adminMoney(Number(item.value))}</b>
                    </strong>
                  ))}
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="ordered"
            name="Order value"
            fill="var(--admin-muted)"
            opacity={0.2}
            maxBarSize={5}
            radius={[4, 4, 0, 0]}
          />
          <Area
            dataKey="collected"
            name="Collected"
            type="linear"
            stroke="var(--admin-text)"
            strokeWidth={1.8}
            fill="none"
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--admin-bg)",
              stroke: "var(--admin-text)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
export function OrderActivityChart({
  data,
}: {
  data: EcommerceOverview["series"];
}) {
  const id = useId().replaceAll(":", "");
  return (
    <div
      className="eco-activity-chart"
      role="img"
      aria-label="Order activity: placed and cancelled orders by date."
    >
      <ResponsiveContainer
        width="100%"
        height={216}
        minWidth={1}
        initialDimension={{ width: 400, height: 216 }}
      >
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--admin-text)"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="var(--admin-text)"
                stopOpacity={0.03}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--admin-border)"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={45}
            tickMargin={10}
            tick={{ fill: "var(--admin-muted)", fontSize: 12 }}
            tickFormatter={dateLabel}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--admin-muted)", fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="admin-chart-tooltip">
                  <span>{dateLabel(String(label))}</span>
                  {payload.map((row) => (
                    <strong key={String(row.dataKey)}>
                      {row.dataKey === "orders" ? "Orders" : "Cancelled"}
                      <b>{row.value}</b>
                    </strong>
                  ))}
                </div>
              ) : null
            }
          />
          <Area
            dataKey="orders"
            type="stepAfter"
            stroke="var(--admin-text)"
            fill={`url(#${id})`}
            strokeWidth={1.7}
            isAnimationActive={false}
          />
          <Line
            dataKey="cancelled"
            type="stepAfter"
            dot={false}
            stroke="#dc2626"
            strokeWidth={1.4}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
const statusNames: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export function OrderBreakdownChart({
  data,
}: {
  data: EcommerceOverview["orderStatuses"];
}) {
  const id = useId().replaceAll(":", "");
  return (
    <div
      className="eco-breakdown-chart"
      role="img"
      aria-label={data
        .map((row) => `${statusNames[row.status]}: ${row.count}`)
        .join(", ")}
    >
      <ResponsiveContainer
        width="100%"
        height={240}
        minWidth={1}
        initialDimension={{ width: 480, height: 240 }}
      >
        <ComposedChart
          data={data}
          layout="vertical"
          margin={{ top: 4, bottom: 4, left: 0, right: 40 }}
          accessibilityLayer
        >
          <defs>
            <pattern
              id={id}
              width="4"
              height="4"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="4" height="4" fill="var(--admin-soft)" />
              <line
                x1="0"
                x2="0"
                y1="0"
                y2="4"
                stroke="var(--admin-muted)"
                strokeOpacity={0.12}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="status"
            axisLine={false}
            tickLine={false}
            width={94}
            tick={{ fill: "var(--admin-text)", fontSize: 13 }}
            tickFormatter={(value) => statusNames[value] || value}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="admin-chart-tooltip">
                  <span>{statusNames[payload[0].payload.status]}</span>
                  <strong>
                    {payload[0].payload.count} orders
                    <b>{Math.round(Number(payload[0].value))}%</b>
                  </strong>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="share"
            background={{ fill: `url(#${id})`, radius: 7 }}
            fill="var(--admin-ring)"
            fillOpacity={0.48}
            barSize={32}
            radius={7}
            isAnimationActive={false}
            label={({ x, y, width, height, index }) => (
              <text
                x={Number(x) + Number(width) + 8}
                y={Number(y) + Number(height) / 2}
                dominantBaseline="middle"
                fill="var(--admin-muted)"
                fontSize={13}
              >
                {data[index ?? 0]?.count}
              </text>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
export function InventoryGauge({
  inventory,
}: {
  inventory: EcommerceOverview["inventory"];
}) {
  const healthy = inventory.total
    ? Math.round((inventory.healthy / inventory.total) * 32)
    : 0;
  const low = inventory.total
    ? Math.round((inventory.low / inventory.total) * 32)
    : 0;
  const segments = Array.from({ length: 32 }, (_, index) => ({
    value: 1,
    color: !inventory.total
      ? "var(--admin-soft)"
      : index < healthy
        ? "var(--admin-muted)"
        : index < healthy + low
          ? "var(--admin-border)"
          : "#dc2626",
  }));
  return (
    <div
      className="eco-gauge"
      role="img"
      aria-label={`${inventory.healthyPercent}% healthy stock. ${inventory.healthy} healthy, ${inventory.low} low stock, ${inventory.out} out of stock.`}
    >
      <ResponsiveContainer
        width="100%"
        height={140}
        minWidth={1}
        initialDimension={{ width: 280, height: 140 }}
      >
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            cx="50%"
            cy={114}
            startAngle={180}
            endAngle={0}
            innerRadius={77}
            outerRadius={108}
            paddingAngle={2}
            cornerRadius={5}
            stroke="var(--admin-bg)"
            strokeWidth={1}
            isAnimationActive={false}
          >
            {segments.map((segment, index) => (
              <Cell key={index} fill={segment.color} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text
                    x={viewBox.cx}
                    y={104}
                    textAnchor="middle"
                    fill="var(--admin-text)"
                  >
                    <tspan x={viewBox.cx} fontSize={26} fontWeight={500}>
                      {inventory.total ? `${inventory.healthyPercent}%` : "—"}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      dy={21}
                      fontSize={12}
                      fill="var(--admin-muted)"
                    >
                      Healthy stock
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
