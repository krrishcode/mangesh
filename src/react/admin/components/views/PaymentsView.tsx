import { useState, type FormEvent } from "react";
import { fetchApi } from "../../../../lib/api";
import { AdminError, useAdminAction, useAdminData } from "../../useAdminData";
import {
  AdminPage,
  AdminFilters,
  AdminSearch,
  adminMoney,
  AdminMetricValue,
  adminDate,
} from "../ui/AdminPage";
import { DataTable, type Column } from "../ui/DataTable";
import { AdminModal } from "../ui/AdminModal";
import { FormField } from "../ui/FormField";
import { StatusBadge } from "../ui/StatusBadge";
import { AdminIcon } from "../ui/AdminIcon";
import {
  useRecordLifecycle,
  type LifecycleRecord,
} from "../ui/RecordLifecycle";
interface Payment extends LifecycleRecord {
  id: number;
  order_id: number;
  order_number: string;
  provider: string;
  reference: string | null;
  amount: number;
  status: string;
  customer_name: string | null;
  customer_email: string;
  created_at: string;
  updated_at: string;
  order_status: string;
}
interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
}
function RecordCollection({
  onSaved,
  onBusyChange,
}: {
  onSaved: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { data, loading, error, reload } =
    useAdminData<Order[]>("/admin/orders");
  const action = useAdminAction();
  const [orderId, setOrderId] = useState("");
  const [reference, setReference] = useState("");
  const eligible = (data ?? []).filter(
    (order) =>
      order.status !== "cancelled" &&
      order.payment_method === "cod" &&
      !["paid", "refunded"].includes(order.payment_status || ""),
  );
  const selected = eligible.find((order) => String(order.id) === orderId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || action.busy) return;
    onBusyChange(true);
    try {
      await action.run(async () => {
        await fetchApi("/admin/payments", {
          method: "POST",
          body: JSON.stringify({
            orderId: selected.id,
            provider: "COD",
            reference: reference.trim() || undefined,
            amount: selected.total_amount,
            status: "paid",
          }),
        });
        onSaved();
      });
    } finally {
      onBusyChange(false);
    }
  }
  if (loading) return <p role="status">Loading eligible orders…</p>;
  if (error) return <AdminError message={error} retry={reload} />;
  if (!eligible.length)
    return (
      <p className="admin-muted">
        There are no outstanding COD orders to collect.
      </p>
    );
  return (
    <form onSubmit={submit}>
      <fieldset className="admin-modal-fields" disabled={action.busy}>
        <FormField label="Order">
          <select
            required
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
          >
            <option value="">Select an outstanding order</option>
            {eligible.map((order) => (
              <option key={order.id} value={order.id}>
                {order.order_number} · {order.customer_name}
              </option>
            ))}
          </select>
        </FormField>
        {selected && (
          <dl className="admin-detail-grid">
            <div>
              <dt>Amount to record</dt>
              <dd>{adminMoney(selected.total_amount)}</dd>
            </div>
            <div>
              <dt>Collection method</dt>
              <dd>Cash on delivery / collection</dd>
            </div>
          </dl>
        )}
        <FormField label="Receipt reference (optional)">
          <input
            maxLength={255}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </FormField>
        <p className="admin-helper">
          Confirm only after the money has been received.
        </p>
        {action.error && <AdminError message={action.error} />}
        <button
          className="admin-btn admin-btn-primary"
          type="submit"
          disabled={!selected || action.busy}
          style={{ marginTop: 18 }}
        >
          {action.busy ? "Recording…" : "Confirm collection received"}
        </button>
      </fieldset>
    </form>
  );
}
export function PaymentsView({
  onNavigate: _onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  const { data, loading, error, reload } =
    useAdminData<Payment[]>("/admin/payments");
  const records = useRecordLifecycle("payments", reload);
  const action = useAdminAction();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [change, setChange] = useState("");
  const [adding, setAdding] = useState(false);
  const [recording, setRecording] = useState(false);
  const payments = data ?? [];
  const selected = payments.find((row) => row.id === selectedId);
  const rows = payments.filter(
    (row) =>
      records.matches(row) &&
      (filter === "all" || row.status === filter) &&
      [
        row.reference,
        row.order_number,
        row.customer_name,
        row.customer_email,
      ].some((value) =>
        value?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
  );
  const collected = payments
    .filter((row) => row.status === "paid")
    .reduce((total, row) => total + row.amount, 0);
  const refunded = payments
    .filter((row) => row.status === "refunded")
    .reduce((total, row) => total + row.amount, 0);
  const columns: Column<Payment>[] = [
    { key: "order_number", label: "Order" },
    {
      key: "customer_name",
      label: "Customer",
      render: (row) => (
        <div>
          {row.customer_name || "Customer unavailable"}
          <small>{row.customer_email}</small>
        </div>
      ),
    },
    { key: "amount", label: "Amount", render: (row) => adminMoney(row.amount) },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {records.marker(row)}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Recorded",
      render: (row) => adminDate(row.created_at),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => {
              action.clearError();
              setChange("");
              setSelectedId(row.id);
            }}
          >
            Details
          </button>
          {records.actions(row, `Payment #${row.id} · ${row.order_number}`)}
        </div>
      ),
    },
  ];
  return (
    <AdminPage
      title="Payments"
      description="Track COD collections and recorded refunds."
      actions={
        <button
          className="admin-btn admin-btn-primary"
          disabled={loading}
          onClick={() => setAdding(true)}
        >
          <AdminIcon name="plus" />
          Record collection
        </button>
      }
    >
      {records.notice}
      {error ? (
        <AdminError message={error} retry={reload} />
      ) : (
        <>
          {!loading && (
            <div className="admin-stats-grid">
              {[
                ["Collected", collected, true],
                [
                  "Pending",
                  payments.filter((row) => row.status === "pending").length,
                ],
                [
                  "Paid records",
                  payments.filter((row) => row.status === "paid").length,
                ],
                ["Refunded", refunded, true],
              ].map(([label, value, currency]) => (
                <div className="admin-stat-card" key={String(label)}>
                  <span>{String(label)}</span>
                  <AdminMetricValue
                    value={Number(value)}
                    currency={currency === true}
                  />
                </div>
              ))}
            </div>
          )}
          <p className="admin-helper" style={{ marginBottom: 18 }}>
            Totals include archived payment records.
          </p>
          <AdminFilters>
            {records.filter}
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholder="Search order, receipt or customer"
            />
            <select
              aria-label="Payment status"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {["pending", "paid", "failed", "refunded"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </AdminFilters>
          <DataTable
            bulk={{ kind: "payments", reload }}
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage="No payments match this view."
          />
        </>
      )}
      {records.dialog}
      <AdminModal
        title={
          selected ? "Payment · " + selected.order_number : "Payment details"
        }
        variant="sheet"
        isOpen={Boolean(selected)}
        busy={action.busy}
        onClose={() => setSelectedId(null)}
      >
        {selected && (
          <>
            <dl className="admin-detail-grid">
              <div>
                <dt>Amount</dt>
                <dd>{adminMoney(selected.amount)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{selected.provider}</dd>
              </div>
              <div>
                <dt>Receipt reference</dt>
                <dd>{selected.reference || "Not provided"}</dd>
              </div>
              <div>
                <dt>Customer</dt>
                <dd>
                  {selected.customer_name || "Unavailable"}
                  <small className="admin-cell-secondary">
                    {selected.customer_email}
                  </small>
                </dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{adminDate(selected.updated_at, true)}</dd>
              </div>
            </dl>
            {action.error && <AdminError message={action.error} />}
            {change ? (
              <div>
                <p>
                  {change === "paid"
                    ? "Confirm that this amount has been received."
                    : "Confirm that this amount has already been returned to the customer."}
                </p>
                <div className="admin-page-actions" style={{ marginTop: 18 }}>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setChange("")}
                  >
                    Keep unchanged
                  </button>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      action.run(async () => {
                        await fetchApi(
                          "/admin/payments/" + selected.id + "/status",
                          {
                            method: "PATCH",
                            body: JSON.stringify({ status: change }),
                          },
                        );
                        setSelectedId(null);
                        setChange("");
                        reload();
                      })
                    }
                  >
                    {action.busy ? "Updating…" : "Confirm payment update"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-page-actions">
                {["pending", "failed"].includes(selected.status) &&
                  selected.order_status !== "cancelled" && (
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={() => setChange("paid")}
                    >
                      Mark collected
                    </button>
                  )}
                {selected.status === "paid" && (
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setChange("refunded")}
                  >
                    Record refund
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </AdminModal>
      <AdminModal
        title="Record a COD collection"
        isOpen={adding}
        busy={recording}
        onClose={() => setAdding(false)}
      >
        <RecordCollection
          onBusyChange={setRecording}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      </AdminModal>
    </AdminPage>
  );
}
