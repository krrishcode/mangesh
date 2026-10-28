import { useEffect, useRef, useState, type FormEvent } from "react";
import { fetchApi } from "../../../../lib/api";
import {
  ORDER_STATUSES,
  availableOrderStatuses,
} from "../../../../lib/order-status";
import type { AccountOrder } from "../../../user/account";
import { AdminError, useAdminAction, useAdminData } from "../../useAdminData";
import {
  AdminPage,
  AdminFilters,
  AdminSearch,
  adminDate,
  adminMoney,
} from "../ui/AdminPage";
import { DataTable, type Column } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import { AdminModal } from "../ui/AdminModal";
import { FormField } from "../ui/FormField";
import {
  useRecordLifecycle,
  type LifecycleRecord,
} from "../ui/RecordLifecycle";
interface Order extends AccountOrder, LifecycleRecord {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}
export function OrdersView({
  initialOrderId,
  onCloseOrder,
}: { initialOrderId?: number; onCloseOrder?: () => void } = {}) {
  const { data, loading, error, reload } =
    useAdminData<Order[]>("/admin/orders");
  const records = useRecordLifecycle("orders", reload);
  const action = useAdminAction();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const openedId = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!initialOrderId) {
      openedId.current = undefined;
      return;
    }
    if (openedId.current === initialOrderId || !data) return;
    const order = data.find((row) => row.id === initialOrderId);
    if (order) {
      openedId.current = initialOrderId;
      setSelectedId(order.id);
      setStatus(order.status);
    }
  }, [initialOrderId, data]);
  const closeOrder = () => {
    setSelectedId(null);
    onCloseOrder?.();
  };
  const selected = data?.find((row) => row.id === selectedId);
  const rows = (data ?? []).filter(
    (row) =>
      records.matches(row) &&
      (filter === "all" || row.status === filter) &&
      [row.order_number, row.customer_name, row.customer_email].some((value) =>
        value?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
  );
  function open(row: Order) {
    action.clearError();
    setSelectedId(row.id);
    setStatus(row.status);
  }
  async function update(event: FormEvent) {
    event.preventDefault();
    if (!selected || status === selected.status) return;
    await action.run(async () => {
      await fetchApi("/admin/orders/" + selected.id + "/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      closeOrder();
      reload();
    });
  }
  const columns: Column<Order>[] = [
    {
      key: "order_number",
      label: "Order",
      render: (row) => (
        <button
          className="admin-text-link admin-strong"
          onClick={() => open(row)}
        >
          {row.order_number}
        </button>
      ),
    },
    {
      key: "customer_name",
      label: "Customer",
      render: (row) => (
        <div>
          {row.customer_name}
          <small>
            {row.customer_email}
            {row.guest ? " · Guest" : ""}
          </small>
        </div>
      ),
    },
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
      key: "total_amount",
      label: "Total",
      render: (row) => adminMoney(row.total_amount),
    },
    {
      key: "created_at",
      label: "Placed",
      render: (row) => adminDate(row.created_at),
    },
    {
      key: "details",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => open(row)}
          >
            Manage
          </button>
          {records.actions(row, row.order_number)}
        </div>
      ),
    },
  ];
  return (
    <AdminPage
      title="Orders"
      description="Review purchases and manage fulfilment."
    >
      {records.notice}
      {error ? (
        <AdminError message={error} retry={reload} />
      ) : (
        <>
          <AdminFilters>
            {records.filter}
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholder="Search order or customer"
            />
            <select
              aria-label="Order status"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </AdminFilters>
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage="No orders match this view."
          />
        </>
      )}
      {records.dialog}
      <AdminModal
        title={selected?.order_number || "Order details"}
        isOpen={Boolean(selected)}
        busy={action.busy}
        onClose={closeOrder}
        maxWidth={720}
        variant="sheet"
      >
        {selected && (
          <>
            <dl className="admin-detail-grid">
              <div>
                <dt>Customer</dt>
                <dd>
                  {selected.customer_name}
                  <small className="admin-cell-secondary">
                    {selected.customer_email}
                    <br />
                    {selected.customer_phone}
                  </small>
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>
                  {selected.payment_method === "cod"
                    ? selected.fulfilment === "pickup"
                      ? "Pay at collection"
                      : "Cash on delivery"
                    : selected.payment_method || "Unavailable"}
                  <small className="admin-cell-secondary">
                    {selected.payment_status || "Status unavailable"}
                  </small>
                </dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {selected.fulfilment === "pickup"
                    ? "Store pickup"
                    : selected.shipping_address
                      ? [
                          selected.shipping_address.fullName,
                          selected.shipping_address.line1,
                          selected.shipping_address.line2,
                          selected.shipping_address.city,
                          selected.shipping_address.state,
                          selected.shipping_address.postalCode,
                          selected.shipping_address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : "Address unavailable"}
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{adminMoney(selected.total_amount)}</dd>
              </div>
            </dl>
            <DataTable
              columns={[
                {
                  key: "title",
                  label: "Item",
                  render: (row) => (
                    <div>
                      {row.title}
                      <small>
                        {[row.color, row.size && "Size " + row.size]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </div>
                  ),
                },
                { key: "quantity", label: "Qty" },
                {
                  key: "price",
                  label: "Total",
                  render: (row) => adminMoney(row.price * row.quantity),
                },
              ]}
              data={selected.items || []}
              pagination={false}
            />
            {selected.shipments?.map((shipment, index) => (
              <dl
                className="admin-detail-grid"
                key={index}
                style={{ marginTop: 20 }}
              >
                <div>
                  <dt>Shipment</dt>
                  <dd>
                    {shipment.carrier || "Carrier not provided"}
                    <small className="admin-cell-secondary">
                      {shipment.status.replaceAll("_", " ")}
                    </small>
                  </dd>
                </div>
                <div>
                  <dt>Tracking number</dt>
                  <dd>{shipment.tracking_number || "Not provided"}</dd>
                </div>
              </dl>
            ))}
            <form onSubmit={update} style={{ marginTop: 24 }}>
              {action.error && <AdminError message={action.error} />}
              <FormField label="Order status">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {availableOrderStatuses(
                    selected.status,
                    selected.payment_status,
                  ).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </FormField>
              {status === "cancelled" && status !== selected.status && (
                <p className="admin-helper">
                  Cancelling restores reserved stock and closes pending
                  payments. This cannot be undone.
                </p>
              )}
              <button
                className={
                  "admin-btn " +
                  (status === "cancelled"
                    ? "admin-btn-danger"
                    : "admin-btn-primary")
                }
                type="submit"
                disabled={action.busy || status === selected.status}
              >
                {action.busy
                  ? "Updating…"
                  : status === "cancelled"
                    ? "Confirm cancellation"
                    : "Update status"}
              </button>
            </form>
          </>
        )}
      </AdminModal>
    </AdminPage>
  );
}
