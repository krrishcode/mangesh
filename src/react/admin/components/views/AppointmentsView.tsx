"use client";

import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
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
import { AdminModal } from "../ui/AdminModal";
import { FormField } from "../ui/FormField";
import { AdminIcon } from "../ui/AdminIcon";
import {
  useRecordLifecycle,
  type LifecycleRecord,
} from "../ui/RecordLifecycle";

const AppointmentCalendar = dynamic(() => import("./AppointmentCalendar"), {
  ssr: false,
  loading: () => (
    <div className="admin-calendar-loading" role="status">
      Loading calendar…
    </div>
  ),
});

interface Appointment extends LifecycleRecord {
  id: number;
  customerId: number;
  location: string;
  occasion: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  customerName: string | null;
  customerEmail: string | null;
}
interface Customer {
  id: number;
  name: string;
  email: string;
  lifecycle?: { archivedAt?: string | null };
}

const localDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function AppointmentsView() {
  const { data, loading, error, reload } = useAdminData<Appointment[]>(
    "/admin/appointments",
  );
  const { data: customers } = useAdminData<Customer[]>("/admin/customers");
  const action = useAdminAction();
  const records = useRecordLifecycle("appointments", reload);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"calendar" | "list">("list");
  const [change, setChange] = useState<{
    row: Appointment;
    status: string;
  } | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    location: "",
    occasion: "",
    scheduledAt: localDateTime(new Date(Date.now() + 86400000)),
    notes: "",
  });
  const appointments = data ?? [];
  const rows = appointments.filter(
    (row) =>
      records.matches(row) &&
      (filter === "all" || row.status === filter) &&
      [row.customerName, row.customerEmail, row.location, row.occasion].some(
        (value) => value?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
  );

  function addAppointment() {
    action.clearError();
    const firstCustomer = (customers ?? []).find(
      (customer) => !customer.lifecycle?.archivedAt,
    );
    setForm({
      customerId: firstCustomer ? String(firstCustomer.id) : "",
      location: "",
      occasion: "",
      scheduledAt: localDateTime(new Date(Date.now() + 86400000)),
      notes: "",
    });
    setOpen(true);
  }

  async function createAppointment(event: FormEvent) {
    event.preventDefault();
    await action.run(async () => {
      await fetchApi("/admin/appointments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          customerId: Number(form.customerId),
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          notes: form.notes || null,
        }),
      });
      setOpen(false);
      reload();
    });
  }

  async function rescheduleAppointment(event: FormEvent) {
    event.preventDefault();
    if (!selected || !scheduledAt) return;
    await action.run(async () => {
      await fetchApi(`/admin/appointments/${selected.id}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      setSelected(null);
      reload();
    });
  }

  const columns: Column<Appointment>[] = [
    {
      key: "customerName",
      label: "Customer",
      render: (row) => (
        <div>
          {row.customerName || "Customer unavailable"}
          <small>{row.customerEmail}</small>
        </div>
      ),
    },
    {
      key: "scheduledAt",
      label: "Scheduled · IST",
      render: (row) => adminDate(row.scheduledAt, true),
    },
    {
      key: "location",
      label: "Visit",
      render: (row) => (
        <div>
          {row.location}
          <small>{row.occasion}</small>
          {row.notes && <small>{row.notes}</small>}
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
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => {
              setSelected(row);
              setScheduledAt(localDateTime(new Date(row.scheduledAt)));
              action.clearError();
            }}
          >
            View
          </button>
          {row.status === "upcoming" && (
            <>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => {
                  action.clearError();
                  setChange({ row, status: "completed" });
                }}
              >
                Complete
              </button>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => {
                  action.clearError();
                  setChange({ row, status: "cancelled" });
                }}
              >
                Cancel
              </button>
            </>
          )}
          {records.actions(
            row,
            `${row.customerName || "Customer"} · ${adminDate(row.scheduledAt, true)}`,
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Appointments"
      description="Schedule and manage fitting and styling visits."
      actions={
        <>
          <div
            className="admin-view-toggle"
            role="group"
            aria-label="Appointment layout"
          >
            <button
              type="button"
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
            >
              <AdminIcon name="appointments" />
              Calendar
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <AdminIcon name="orders" />
              List
            </button>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={addAppointment}
          >
            <AdminIcon name="plus" />
            Add appointment
          </button>
        </>
      }
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
              placeholder="Search customer or location"
            />
            <select
              aria-label="Appointment status"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All visits</option>
              {["upcoming", "completed", "cancelled"].map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </AdminFilters>
          {view === "calendar" ? (
            <div className="admin-calendar-page">
              <AppointmentCalendar
                appointments={rows}
                loading={loading}
                onSelect={(appointment) => {
                  const record = appointments.find(
                    (item) => item.id === appointment.id,
                  );
                  if (!record) return;
                  setSelected(record);
                  setScheduledAt(localDateTime(new Date(record.scheduledAt)));
                  action.clearError();
                }}
              />
            </div>
          ) : (
            <DataTable
              bulk={{ kind: "appointments", reload }}
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage="No appointments match this view."
            />
          )}
        </>
      )}

      <AdminModal
        title="Schedule appointment"
        isOpen={open}
        busy={action.busy}
        onClose={() => setOpen(false)}
        variant="sheet"
        description="Create a fitting or styling visit for a registered customer."
      >
        <form onSubmit={createAppointment}>
          {action.error && <AdminError message={action.error} />}
          <FormField label="Customer">
            <select
              required
              value={form.customerId}
              onChange={(event) =>
                setForm({ ...form, customerId: event.target.value })
              }
            >
              <option value="">Select a customer</option>
              {(customers ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.email}
                  {customer.lifecycle?.archivedAt ? " · archived" : ""}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Visit location">
            <input
              required
              minLength={2}
              maxLength={255}
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
              placeholder="Store or address"
            />
          </FormField>
          <FormField label="Occasion">
            <input
              required
              minLength={2}
              maxLength={255}
              value={form.occasion}
              onChange={(event) =>
                setForm({ ...form, occasion: event.target.value })
              }
              placeholder="Wedding, celebration…"
            />
          </FormField>
          <FormField label="Date and time">
            <input
              required
              type="datetime-local"
              min={localDateTime(new Date(Date.now() + 60000))}
              value={form.scheduledAt}
              onChange={(event) =>
                setForm({ ...form, scheduledAt: event.target.value })
              }
            />
          </FormField>
          <FormField label="Notes (optional)">
            <textarea
              maxLength={4000}
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </FormField>
          <button
            className="admin-btn admin-btn-primary"
            type="submit"
            disabled={!form.customerId || action.busy}
          >
            {action.busy ? "Scheduling…" : "Schedule appointment"}
          </button>
        </form>
      </AdminModal>

      <AdminModal
        title={
          selected
            ? selected.customerName || "Appointment details"
            : "Appointment details"
        }
        variant="sheet"
        isOpen={Boolean(selected)}
        busy={action.busy}
        onClose={() => setSelected(null)}
        description={selected?.customerEmail || undefined}
      >
        {selected && (
          <>
            {action.error && <AdminError message={action.error} />}
            <dl className="admin-detail-grid">
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{selected.location}</dd>
              </div>
              <div>
                <dt>Occasion</dt>
                <dd>{selected.occasion}</dd>
              </div>
              <div>
                <dt>Scheduled · IST</dt>
                <dd>{adminDate(selected.scheduledAt, true)}</dd>
              </div>
              {selected.notes && (
                <div>
                  <dt>Notes</dt>
                  <dd>{selected.notes}</dd>
                </div>
              )}
            </dl>
            {selected.status === "upcoming" && (
              <form
                onSubmit={rescheduleAppointment}
                className="admin-calendar-reschedule"
              >
                <FormField label="Reschedule visit">
                  <input
                    required
                    type="datetime-local"
                    min={localDateTime(new Date(Date.now() + 60000))}
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                  />
                </FormField>
                <button
                  className="admin-btn admin-btn-secondary"
                  type="submit"
                  disabled={action.busy}
                >
                  {action.busy ? "Saving…" : "Save new time"}
                </button>
              </form>
            )}
            {selected.status === "upcoming" && (
              <div className="admin-page-actions admin-calendar-actions">
                <button
                  className="admin-btn admin-btn-secondary"
                  disabled={action.busy}
                  onClick={() => {
                    setChange({ row: selected, status: "completed" });
                    setSelected(null);
                  }}
                >
                  Mark completed
                </button>
                <button
                  className="admin-btn admin-btn-ghost"
                  disabled={action.busy}
                  onClick={() => {
                    setChange({ row: selected, status: "cancelled" });
                    setSelected(null);
                  }}
                >
                  Cancel visit
                </button>
              </div>
            )}
            {records.actions(
              selected,
              `${selected.customerName || "Customer"} · ${adminDate(selected.scheduledAt, true)}`,
            )}
          </>
        )}
      </AdminModal>
      <AdminModal
        title={
          change?.status === "completed"
            ? "Complete this visit?"
            : "Cancel this visit?"
        }
        isOpen={Boolean(change)}
        busy={action.busy}
        onClose={() => setChange(null)}
      >
        <p>
          {change?.row.customerName || "Customer"} ·{" "}
          {change && adminDate(change.row.scheduledAt, true)}
          <br />
          {change?.row.location}
        </p>
        {action.error && <AdminError message={action.error} />}
        <div className="admin-page-actions" style={{ marginTop: 22 }}>
          <button
            className="admin-btn admin-btn-secondary"
            disabled={action.busy}
            onClick={() => setChange(null)}
          >
            Keep unchanged
          </button>
          <button
            className={
              "admin-btn " +
              (change?.status === "cancelled"
                ? "admin-btn-danger"
                : "admin-btn-primary")
            }
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                await fetchApi(`/admin/appointments/${change!.row.id}/status`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: change!.status }),
                });
                setChange(null);
                reload();
              })
            }
          >
            {action.busy ? "Updating…" : "Confirm update"}
          </button>
        </div>
      </AdminModal>
    </AdminPage>
  );
}
