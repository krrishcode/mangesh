import { useState } from "react";
import { fetchApi } from "../../../../lib/api";
import { AdminError, useAdminData, useAdminAction } from "../../useAdminData";
import {
  AdminPage,
  AdminFilters,
  AdminSearch,
  adminDate,
} from "../ui/AdminPage";
import { DataTable, type Column } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import {
  useRecordLifecycle,
  type LifecycleRecord,
} from "../ui/RecordLifecycle";
interface Review extends LifecycleRecord {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: string;
  customerName: string | null;
  productTitle: string | null;
}
export function ReviewsView() {
  const { data, loading, error, reload } =
    useAdminData<Review[]>("/admin/reviews");
  const action = useAdminAction();
  const records = useRecordLifecycle("reviews", reload);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const rows = (data ?? []).filter(
    (row) =>
      (filter === "all" || row.status === filter) &&
      [row.customerName, row.productTitle, row.title, row.body].some((value) =>
        value?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
  );
  const update = (id: number, status: string) =>
    action.run(async () => {
      await fetchApi("/admin/reviews/" + id + "/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      reload();
    });
  const columns: Column<Review>[] = [
    {
      key: "productTitle",
      label: "Product",
      render: (row) => (
        <div>
          {row.productTitle || "Product unavailable"}
          <small>{row.customerName || "Customer unavailable"}</small>
        </div>
      ),
    },
    { key: "rating", label: "Rating", render: (row) => row.rating + " / 5" },
    {
      key: "title",
      label: "Review",
      render: (row) => (
        <div className="admin-review-copy">
          <strong>{row.title}</strong>
          <p className="admin-muted">{row.body || "No written review."}</p>
          <small>{adminDate(row.createdAt)}</small>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Moderate",
      sortable: false,
      render: (row) => (
        <div className="admin-page-actions">
          {row.status !== "approved" && (
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={action.busy}
              onClick={() => update(row.id, "approved")}
            >
              Approve
            </button>
          )}
          {row.status !== "rejected" && (
            <button
              className="admin-btn admin-btn-ghost admin-btn-sm"
              disabled={action.busy}
              onClick={() => update(row.id, "rejected")}
            >
              Reject
            </button>
          )}
          {records.actions(
            row,
            `Review #${row.id} · ${row.productTitle || "Product"}`,
          )}
        </div>
      ),
    },
  ];
  return (
    <AdminPage
      title="Reviews"
      description="Review customer feedback before it appears in the store."
    >
      {records.notice}
      {action.error && <AdminError message={action.error} />}
      {error ? (
        <AdminError message={error} retry={reload} />
      ) : (
        <>
          <AdminFilters>
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholder="Search reviews or products"
            />
            <select
              aria-label="Review status"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All reviews</option>
              {["pending", "approved", "rejected"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </AdminFilters>
          <DataTable
            bulk={{ kind: "reviews", reload }}
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage={
              filter === "pending"
                ? "No reviews waiting for approval."
                : "No reviews match this view."
            }
          />
        </>
      )}
      {records.dialog}
    </AdminPage>
  );
}
