import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminActionMenu } from "./AdminActionMenu";
import { AdminIcon, type AdminIconName } from "./AdminIcon";
import { BulkActions } from "./BulkActions";
import type { AdminRecordKind } from "../../../../lib/admin-records";
const columnIcons: Record<string, AdminIconName> = {
  title: "products",
  name: "customers",
  customer_name: "customers",
  customerName: "customers",
  productTitle: "products",
  categoryName: "categories",
  order_number: "orders",
  status: "check",
  isActive: "check",
  effectivePrice: "payments",
  total_amount: "payments",
  amount: "payments",
  totalSpent: "payments",
  stock: "products",
  created_at: "appointments",
  createdAt: "appointments",
  scheduledAt: "appointments",
  rating: "reviews",
};
export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}
interface Props<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  actions?: ReactNode;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  pagination?: boolean;
  onRowClick?: (item: T) => void;
  bulk?: { kind: AdminRecordKind; reload: () => void };
}
export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const numberPattern = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if (numberPattern.test(String(a)) && numberPattern.test(String(b)))
    return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  actions,
  pageSize = 10,
  emptyMessage = "No records found.",
  loading = false,
  pagination = true,
  onRowClick,
  bulk,
}: Props<T>) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(pageSize);
  useEffect(() => setPageLimit(pageSize), [pageSize]);
  const [sort, setSort] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const datasetKey = data
    .map((item, index) => String(item.id ?? index))
    .join(",");
  useEffect(() => setPage(1), [datasetKey, pageLimit]);
  useEffect(() => {
    const available = new Set(data.map((item) => item.id));
    setSelected((previous) => new Set([...previous].filter((id) => available.has(id))));
  }, [datasetKey]);
  const sorted = useMemo(
    () =>
      !sort
        ? data
        : [...data].sort(
            (a, b) =>
              compareValues(a[sort.key], b[sort.key]) *
              (sort.direction === "asc" ? 1 : -1),
          ),
    [data, sort],
  );
  const pages = Math.max(1, Math.ceil(data.length / pageLimit));
  const current = Math.min(page, pages);
  const records = pagination
    ? sorted.slice((current - 1) * pageLimit, current * pageLimit)
    : sorted;
  return (
    <div className="admin-table-wrap" aria-busy={loading}>
      {(title || actions) && (
        <div className="admin-table-header">
          <h2 className="admin-table-title">{title}</h2>
          {actions}
        </div>
      )}
      {bulk && (
        <BulkActions kind={bulk.kind} rows={data.filter((item) => selected.has(item.id)).map((item) => ({ id: item.id }))}
          onFinished={(succeeded) => { setSelected((previous) => new Set([...previous].filter((id) => !succeeded.includes(id)))); bulk.reload(); }}
          onClear={() => setSelected(new Set())} />
      )}
      {loading ? (
        <div
          className="admin-list-loading"
          role="status"
          aria-label="Loading records"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <div className="admin-skeleton" key={i} />
          ))}
        </div>
      ) : !data.length ? (
        <div className="admin-empty">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="admin-table-scroll">
            <table className="admin-table" aria-label={title || "Records"}>
              <thead>
                <tr>
                  {bulk && <th className="admin-selection-cell"><input type="checkbox" aria-label="Select all records on this page" ref={(input) => { if (input) input.indeterminate = records.some((item) => selected.has(item.id)) && !records.every((item) => selected.has(item.id)); }} checked={records.length > 0 && records.every((item) => selected.has(item.id))} onChange={(event) => setSelected((previous) => { const next = new Set(previous); records.forEach((item) => event.target.checked ? next.add(item.id) : next.delete(item.id)); return next; })} /></th>}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={
                        column.key === "actions" || column.key === "details"
                          ? "admin-actions-column"
                          : undefined
                      }
                      style={column.width ? { width: column.width } : undefined}
                      aria-sort={
                        sort?.key === column.key
                          ? sort.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {column.sortable === false ? (
                        column.key === "actions" || column.key === "details" ? (
                          "Actions"
                        ) : (
                          column.label
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSort({
                              key: column.key,
                              direction:
                                sort?.key === column.key &&
                                sort.direction === "asc"
                                  ? "desc"
                                  : "asc",
                            });
                            setPage(1);
                          }}
                        >
                          {columnIcons[column.key] && (
                            <AdminIcon name={columnIcons[column.key]} />
                          )}
                          {column.label}
                          {sort?.key === column.key && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              aria-hidden="true"
                            >
                              <path
                                d={
                                  sort.direction === "asc"
                                    ? "m6 15 6-6 6 6"
                                    : "m6 9 6 6 6-6"
                                }
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((item, index) => (
                  <tr
                    key={item.id ?? index}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === "Enter") onRowClick(item);
                          }
                        : undefined
                    }
                  >
                    {bulk && <td className="admin-selection-cell" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select record ${item.id}`} checked={selected.has(item.id)} onChange={(event) => setSelected((previous) => { const next = new Set(previous); event.target.checked ? next.add(item.id) : next.delete(item.id); return next; })} /></td>}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={
                          column.key === "actions" || column.key === "details"
                            ? "admin-actions-column"
                            : undefined
                        }
                      >
                        {column.render &&
                        (column.key === "actions" ||
                          column.key === "details") ? (
                          <AdminActionMenu
                            label={`Actions for ${item.title || item.order_number || item.name || item.customerName || `record ${item.id ?? index + 1}`}`}
                          >
                            {column.render(item)}
                          </AdminActionMenu>
                        ) : column.render ? (
                          column.render(item)
                        ) : (
                          String(item[column.key] ?? "—")
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && data.length > 0 && (
            <div className="admin-pagination">
              <span>
                {(current - 1) * pageLimit + 1}–
                {Math.min(current * pageLimit, data.length)} of {data.length}{" "}
                records
              </span>
              <div className="admin-pagination-controls">
                <label className="admin-page-size">
                  Rows per page{" "}
                  <select
                    aria-label="Rows per page"
                    value={pageLimit}
                    onChange={(event) =>
                      setPageLimit(Number(event.target.value))
                    }
                  >
                    {[...new Set([pageSize, 10, 25, 50])]
                      .sort((a, b) => a - b)
                      .map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-pagination-btn"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  <AdminIcon name="chevron" />
                  <span className="admin-sr-only">Previous page</span>
                </button>
                <span>
                  Page {current} of {pages}
                </span>
                <button
                  type="button"
                  className="admin-pagination-btn"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  <AdminIcon name="chevron" />
                  <span className="admin-sr-only">Next page</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
