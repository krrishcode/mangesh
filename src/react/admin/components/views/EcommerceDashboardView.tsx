import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  PackageX,
  Star,
  TriangleAlert,
} from "lucide-react";
import type {
  EcommerceOverview,
  OverviewChannel,
  OverviewPeriod,
} from "../../../../lib/ecommerce-overview";
import { AdminError, useAdminData } from "../../useAdminData";
import {
  AdminPage,
  AdminMetricValue,
  AdminSearch,
  adminDate,
  adminMoney,
} from "../ui/AdminPage";
import { AdminIcon, type AdminIconName } from "../ui/AdminIcon";
import { DataTable, type Column } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";

const SalesChart = dynamic(
  () =>
    import("../ui/EcommerceCharts").then((module) => module.SalesOverviewChart),
  {
    ssr: false,
    loading: () => <div className="eco-sales-chart admin-skeleton" />,
  },
);
const ActivityChart = dynamic(
  () =>
    import("../ui/EcommerceCharts").then((module) => module.OrderActivityChart),
  {
    ssr: false,
    loading: () => <div className="eco-activity-chart admin-skeleton" />,
  },
);
const BreakdownChart = dynamic(
  () =>
    import("../ui/EcommerceCharts").then(
      (module) => module.OrderBreakdownChart,
    ),
  {
    ssr: false,
    loading: () => <div className="eco-breakdown-chart admin-skeleton" />,
  },
);
const Gauge = dynamic(
  () => import("../ui/EcommerceCharts").then((module) => module.InventoryGauge),
  { ssr: false, loading: () => <div className="eco-gauge admin-skeleton" /> },
);

function Change({
  current,
  previous,
  currency = false,
  inverse = false,
}: {
  current: number;
  previous: number;
  currency?: boolean;
  inverse?: boolean;
}) {
  const difference = current - previous;
  if (!previous)
    return (
      <p className="eco-metric-change">
        <span
          className={
            current > 0 ? (inverse ? "eco-negative" : "eco-positive") : ""
          }
        >
          {current > 0 ? "New this period" : "No change"}
        </span>
      </p>
    );
  const text = currency
    ? `${difference > 0 ? "+" : ""}${adminMoney(difference)}`
    : previous
      ? `${difference > 0 ? "+" : ""}${(((current - previous) / previous) * 100).toFixed(1)}%`
      : difference
        ? `${difference > 0 ? "+" : ""}${difference.toLocaleString("en-IN")}`
        : "No change";
  return (
    <p className="eco-metric-change">
      <span
        className={
          difference > 0
            ? inverse
              ? "eco-negative"
              : "eco-positive"
            : difference < 0
              ? inverse
                ? "eco-positive"
                : "eco-negative"
              : ""
        }
      >
        {text}
      </span>
      <span> vs previous period</span>
    </p>
  );
}
function PanelHeading({
  title,
  value,
  actionLabel,
  onClick,
}: {
  title: string;
  value: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <header className="eco-panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{value}</p>
      </div>
      <button
        className="admin-icon-button"
        aria-label={actionLabel}
        onClick={onClick}
      >
        <AdminIcon name="external" />
      </button>
    </header>
  );
}

type RecentOrder = EcommerceOverview["recentOrders"][number];
export function EcommerceDashboardView({
  onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  const [period, setPeriod] = useState<OverviewPeriod>("90d");
  const [channel, setChannel] = useState<OverviewChannel>("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const { data, loading, error, reload } = useAdminData<EcommerceOverview>(
    `/admin/overview?period=${period}&channel=${channel}`,
  );
  const emptyInventory = {
    healthy: 0,
    low: 0,
    out: 0,
    total: 0,
    healthyPercent: 0,
  };
  const inventory = data?.inventory ?? emptyInventory;
  const currentReview =
    data?.reviews.latest[reviewIndex % Math.max(1, data.reviews.latest.length)];
  const categoryColors = [
    "var(--admin-muted)",
    "var(--admin-ring)",
    "var(--admin-border)",
    "var(--admin-soft)",
  ];
  const metrics: {
    label: string;
    key:
      | "collected"
      | "orders"
      | "customers"
      | "averageOrder"
      | "refunds"
      | "inventory";
    icon: AdminIconName;
    currency?: boolean;
  }[] = [
    {
      label: "Collected sales",
      key: "collected",
      icon: "payments",
      currency: true,
    },
    { label: "Total orders", key: "orders", icon: "orders" },
    { label: "New customers", key: "customers", icon: "customers" },
    {
      label: "Average order",
      key: "averageOrder",
      icon: "orders",
      currency: true,
    },
    { label: "Refunded payments", key: "refunds", icon: "payments" },
    { label: "Healthy stock", key: "inventory", icon: "products" },
  ];
  const rows = (data?.recentOrders ?? []).filter((row) => {
    const match =
      orderFilter === "all" ||
      (orderFilter === "action" &&
        (row.status === "pending" || row.payment_status === "pending")) ||
      (orderFilter === "unfulfilled" &&
        ["pending", "processing"].includes(row.status)) ||
      (orderFilter === "unpaid" &&
        ["pending", "failed"].includes(row.payment_status ?? "")) ||
      (orderFilter === "refunded" && row.payment_status === "refunded");
    return (
      match &&
      `${row.order_number} ${row.customer_name}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );
  });
  const columns: Column<RecentOrder>[] = [
    {
      key: "order_number",
      label: "Order",
      render: (row) => (
        <div>
          <button
            className="admin-text-link admin-strong"
            onClick={() => onNavigate?.(`orders/${row.id}`)}
          >
            {row.order_number}
          </button>
          <small>
            {row.items_count} {row.items_count === 1 ? "item" : "items"}
          </small>
        </div>
      ),
    },
    { key: "customer_name", label: "Customer" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <div className="eco-order-status">
          <StatusBadge status={row.payment_status || "unrecorded"} />
          <StatusBadge
            status={
              ["pending", "processing"].includes(row.status)
                ? "unfulfilled"
                : row.status === "delivered"
                  ? "fulfilled"
                  : row.status
            }
            variant={
              row.status === "delivered"
                ? "success"
                : row.status === "cancelled"
                  ? "danger"
                  : "neutral"
            }
          />
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Total",
      render: (row) => adminMoney(row.total_amount),
    },
    {
      key: "created_at",
      label: "Date",
      render: (row) => adminDate(row.created_at, true),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <button
          className="admin-btn"
          onClick={() => onNavigate?.(`orders/${row.id}`)}
        >
          View order
        </button>
      ),
    },
  ];
  const date = data?.generatedAt
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(data.generatedAt))
    : "Your store at a glance.";
  return (
    <AdminPage
      title="Store Overview"
      description={date}
      actions={
        <>
          <select
            aria-label="Overview period"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value as OverviewPeriod);
              setReviewIndex(0);
            }}
          >
            <option value="month">This month</option>
            <option value="last-month">Last month</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          <select
            aria-label="Overview channel"
            value={channel}
            onChange={(event) =>
              setChannel(event.target.value as OverviewChannel)
            }
          >
            <option value="all">All channels</option>
            <option value="home">Home delivery</option>
            <option value="pickup">Store pickup</option>
            <option value="legacy">Legacy orders</option>
          </select>
          <button
            className="admin-icon-button eco-refresh"
            aria-label="Refresh overview"
            disabled={loading}
            onClick={reload}
          >
            <AdminIcon name="refresh" />
          </button>
        </>
      }
    >
      {error ? (
        <AdminError message={error} retry={reload} />
      ) : (
        <div className="eco-dashboard" aria-busy={loading}>
          <section className="eco-kpi-strip">
            <div className="eco-kpi-grid">
              {metrics.map((metric) => (
                <div key={metric.key} className="eco-kpi">
                  <div className="eco-kpi-label">
                    <span>{metric.label}</span>
                    <span className="eco-kpi-icon">
                      <AdminIcon name={metric.icon} />
                    </span>
                  </div>
                  {loading ? (
                    <div className="admin-skeleton eco-value-skeleton" />
                  ) : metric.key === "inventory" ? (
                    <strong className="admin-stat-value">
                      {inventory.total ? `${inventory.healthyPercent}%` : "—"}
                    </strong>
                  ) : (
                    <AdminMetricValue
                      value={data?.current[metric.key] ?? 0}
                      currency={metric.currency}
                    />
                  )}
                  <div className="eco-kpi-note">
                    {loading ? (
                      <span className="admin-muted">Loading…</span>
                    ) : metric.key === "inventory" ? (
                      <p className="admin-muted">
                        {inventory.healthy} of {inventory.total} products
                      </p>
                    ) : metric.key === "customers" ? (
                      <p className="admin-muted">New registrations</p>
                    ) : (
                      <Change
                        current={data?.current[metric.key] ?? 0}
                        previous={data?.previous[metric.key] ?? 0}
                        currency={metric.key === "averageOrder"}
                        inverse={metric.key === "refunds"}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="eco-sales-panel">
              <header className="eco-sales-heading">
                <h2>Sales Overview</h2>
                <button
                  className="admin-icon-button"
                  aria-label="View collections"
                  onClick={() => onNavigate?.("payments")}
                >
                  <AdminIcon name="external" />
                </button>
              </header>
              {loading ? (
                <div className="eco-sales-chart admin-skeleton" />
              ) : (
                <SalesChart data={data?.series ?? []} />
              )}
              <div className="admin-sr-only">
                <span>
                  <i className="eco-dot eco-dark" />
                  Collected sales
                </span>
                <span>
                  <i className="eco-dot eco-light" />
                  Order value
                </span>
                <small>
                  {data
                    ? `${adminDate(data.range.start)} – ${adminDate(data.range.end)}`
                    : ""}
                </small>
              </div>
            </div>
          </section>
          <div className="eco-charts-row">
            <section className="eco-panel">
              <PanelHeading
                title="Order Activity"
                value={`${data?.current.orders ?? 0} orders`}
                actionLabel="View order activity"
                onClick={() => onNavigate?.("orders")}
              />
              <div className="eco-legend eco-chart-legend">
                <span>
                  <i className="eco-dot eco-red" />
                  Cancelled
                </span>
                <span>
                  <i className="eco-dot eco-dark" />
                  Orders
                </span>
              </div>
              {loading ? (
                <div className="eco-activity-chart admin-skeleton" />
              ) : (
                <ActivityChart data={data?.series ?? []} />
              )}
            </section>
            <section className="eco-panel">
              <PanelHeading
                title="Order Breakdown"
                value={`${data?.current.orders ?? 0} orders by fulfilment status`}
                actionLabel="Manage fulfilment"
                onClick={() => onNavigate?.("orders")}
              />
              {loading ? (
                <div className="eco-breakdown-chart admin-skeleton" />
              ) : (
                <BreakdownChart data={data?.orderStatuses ?? []} />
              )}
            </section>
          </div>
          <div className="eco-details-row">
            <section className="eco-panel">
              <PanelHeading
                title="Top Products"
                value={`${Math.round(data?.topProductShare ?? 0)}% of ordered value`}
                actionLabel="Manage top products"
                onClick={() => onNavigate?.("products")}
              />
              <div
                className="eco-category-chart"
                role="img"
                aria-label="Ordered merchandise value by category"
              >
                {data?.categories.map((category, index) => (
                  <span
                    key={category.name}
                    style={{
                      width: `${category.share}%`,
                      background: categoryColors[Math.min(index, 3)],
                    }}
                    title={`${category.name}: ${Math.round(category.share)}%`}
                  />
                ))}
              </div>
              <div className="eco-category-legend">
                {data?.categories.slice(0, 3).map((category, index) => (
                  <span key={category.name}>
                    <i
                      className="eco-dot"
                      style={{ background: categoryColors[index] }}
                    />
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="eco-top-products">
                <div className="eco-top-header">
                  <span>Products</span>
                  <span>Share</span>
                  <span>Value</span>
                </div>
                {data?.topProducts.map((product) => (
                  <div
                    className="eco-top-row"
                    key={`${product.id}-${product.title}`}
                  >
                    <div>
                      <strong title={product.title}>{product.title}</strong>
                      <small>{product.category}</small>
                    </div>
                    <span>{Math.round(product.share)}%</span>
                    <strong>{adminMoney(product.amount)}</strong>
                  </div>
                ))}
                {!loading && !data?.topProducts.length && (
                  <p className="eco-panel-empty">
                    No product orders in this period.
                  </p>
                )}
              </div>
            </section>
            <section className="eco-panel">
              <PanelHeading
                title="Inventory"
                value={
                  inventory.total
                    ? `${inventory.healthyPercent}% healthy stock`
                    : "No active products"
                }
                actionLabel="Manage inventory"
                onClick={() => onNavigate?.("products")}
              />
              {loading ? (
                <div className="eco-gauge admin-skeleton" />
              ) : (
                <Gauge inventory={inventory} />
              )}
              <div className="eco-inventory-stats">
                {[
                  {
                    label: "In stock",
                    value: inventory.healthy,
                    Icon: PackageCheck,
                  },
                  {
                    label: "Low stock",
                    value: inventory.low,
                    Icon: TriangleAlert,
                  },
                  { label: "Out", value: inventory.out, Icon: PackageX },
                ].map(({ label, value, Icon }) => (
                  <div key={label}>
                    <span className="eco-inventory-icon">
                      <Icon size={17} strokeWidth={1.6} />
                    </span>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="eco-panel">
              <PanelHeading
                title="Reviews"
                value={
                  data?.reviews.average != null
                    ? `${data.reviews.average.toFixed(1)} average rating`
                    : "No approved ratings"
                }
                actionLabel="Manage reviews"
                onClick={() => onNavigate?.("reviews")}
              />
              <div className="eco-review-content">
                <div className="eco-review-top">
                  <div
                    className="eco-review-stars"
                    aria-label={`${currentReview?.rating ?? 0} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        size={14}
                        fill={
                          index < (currentReview?.rating ?? 0)
                            ? "currentColor"
                            : "none"
                        }
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <div className="eco-review-buttons">
                    <button
                      className="admin-icon-button"
                      aria-label="Previous review"
                      disabled={!data || data.reviews.latest.length < 2}
                      onClick={() =>
                        setReviewIndex(
                          (index) =>
                            (index - 1 + (data?.reviews.latest.length ?? 1)) %
                            (data?.reviews.latest.length ?? 1),
                        )
                      }
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="admin-icon-button"
                      aria-label="Next review"
                      disabled={!data || data.reviews.latest.length < 2}
                      onClick={() => setReviewIndex((index) => index + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <strong>
                  {currentReview?.customerName || "Customer reviews"}
                </strong>
                <p>
                  {currentReview?.body ||
                    currentReview?.title ||
                    "Approved reviews from this period will appear here."}
                </p>
              </div>
              <div className="eco-review-summary">
                <div>
                  <strong>{data?.reviews.total ?? 0} reviews</strong>
                  <small>
                    {data?.reviews.pending ?? 0} waiting for approval
                  </small>
                </div>
                <div className="eco-review-avatars" aria-hidden="true">
                  {data?.reviews.latest.slice(0, 3).map((review) => (
                    <span key={review.id}>
                      {(review.customerName || "Customer")
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <section className="eco-recent-orders">
            <header className="eco-orders-heading">
              <div>
                <h2>Recent Orders</h2>
                <p>{data?.current.orders ?? 0} orders in this period</p>
              </div>
              <button
                className="admin-icon-button"
                aria-label="View all orders"
                onClick={() => onNavigate?.("orders")}
              >
                <AdminIcon name="external" />
              </button>
            </header>
            <div className="eco-order-toolbar">
              <div
                className="eco-order-tabs"
                role="group"
                aria-label="Filter recent orders"
              >
                {[
                  { id: "all", label: "All" },
                  { id: "action", label: "Needs action" },
                  { id: "unfulfilled", label: "Unfulfilled" },
                  { id: "unpaid", label: "Unpaid" },
                  { id: "refunded", label: "Refunded" },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    aria-pressed={orderFilter === tab.id}
                    onClick={() => setOrderFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <AdminSearch
                value={search}
                onChange={setSearch}
                placeholder="Search recent orders"
              />
            </div>
            <DataTable
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage="No orders match this period and filter."
            />
          </section>
        </div>
      )}
    </AdminPage>
  );
}
