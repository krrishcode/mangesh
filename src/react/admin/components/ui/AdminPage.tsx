import type { ReactNode } from "react";
import { AdminIcon } from "./AdminIcon";
export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="admin-page-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
export function AdminSearch({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="admin-search">
      <AdminIcon name="search" />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
export function AdminFilters({ children }: { children: ReactNode }) {
  return <div className="admin-filters">{children}</div>;
}
export const adminMoney = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
export function AdminMetricValue({
  value,
  currency = false,
}: {
  value: number;
  currency?: boolean;
}) {
  const full = currency ? adminMoney(value) : value.toLocaleString("en-IN");
  const compact = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
    ...(currency ? { style: "currency", currency: "INR" } : {}),
  }).format(value);
  return (
    <strong className="admin-stat-value" title={full} aria-label={full}>
      <span className="admin-value-full" aria-hidden="true">
        {full}
      </span>
      <span className="admin-value-compact" aria-hidden="true">
        {compact}
      </span>
    </strong>
  );
}
export const adminDate = (value: string, time = false) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
        ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
      }).format(date);
};
