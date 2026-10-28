import { useState } from "react";
import { AdminError, useAdminData } from "../../useAdminData";
import {
  AdminPage,
  AdminSearch,
  AdminFilters,
  adminDate,
  adminMoney,
} from "../ui/AdminPage";
import { DataTable, type Column } from "../ui/DataTable";
import {
  useRecordLifecycle,
  type LifecycleRecord,
} from "../ui/RecordLifecycle";
interface Customer extends LifecycleRecord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
}
export function CustomersView() {
  const { data, loading, error, reload } =
    useAdminData<Customer[]>("/admin/customers");
  const records = useRecordLifecycle("customers", reload);
  const [search, setSearch] = useState("");
  const rows = (data ?? [])
    .filter((row) => records.matches(row))
    .filter((row) =>
      [row.name, row.email, row.phone].some((value) =>
        value?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    );
  const columns: Column<Customer>[] = [
    {
      key: "name",
      label: "Customer",
      render: (row) => (
        <div className="admin-strong">
          {row.name}
          <small>{row.email}</small>
          {records.marker(row)}
        </div>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "ordersCount", label: "Orders" },
    {
      key: "totalSpent",
      label: "Collected",
      render: (row) => adminMoney(row.totalSpent),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (row) => adminDate(row.createdAt),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="admin-page-actions">
          {records.actions(row, row.name)}
        </div>
      ),
    },
  ];
  return (
    <AdminPage
      title="Customers"
      description="Registered customers and their purchase history."
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
              placeholder="Search name, email or phone"
            />
          </AdminFilters>
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage={
              search
                ? "No customers match your search."
                : "No registered customers yet."
            }
          />
        </>
      )}
      {records.dialog}
    </AdminPage>
  );
}
