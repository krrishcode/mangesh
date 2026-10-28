import { useMemo, useState } from "react";
import { AdminError, useAdminData } from "../../useAdminData";
import {
  AdminPage,
  AdminSearch,
  AdminFilters,
  adminMoney,
} from "../ui/AdminPage";
import { DataTable, type Column } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import { AdminIcon } from "../ui/AdminIcon";
import { useRecordLifecycle } from "../ui/RecordLifecycle";
export interface Product {
  id: number;
  title: string;
  slug: string;
  sku: string;
  price: string;
  salePrice: string | null;
  stock: number;
  unitsSold: number;
  categoryId: number | null;
  categoryName?: string | null;
  imageFront: string | null;
  isActive: boolean;
  createdAt: string;
  [key: string]: any;
}
export function ProductsView({
  onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  const { data, loading, error, reload } =
    useAdminData<Product[]>("/admin/products");
  const records = useRecordLifecycle("products", reload);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const categories = useMemo(
    () => [
      ...new Map(
        (data ?? [])
          .filter((row) => row.categoryId)
          .map((row) => [String(row.categoryId), row.categoryName]),
      ).entries(),
    ],
    [data],
  );
  const rows = (data ?? [])
    .filter(
      (row) =>
        [row.title, row.sku].some((value) =>
          value?.toLowerCase().includes(search.trim().toLowerCase()),
        ) &&
        (status === "all" || row.isActive === (status === "published")) &&
        (category === "all" || String(row.categoryId) === category),
    )
    .map((row) => ({
      ...row,
      effectivePrice: Number(row.salePrice || row.price),
    }));
  const columns: Column<Product>[] = [
    {
      key: "title",
      label: "Product",
      render: (row) => (
        <div className="admin-product-cell">
          <div className="admin-product-thumb">
            {row.imageFront ? (
              <img src={row.imageFront} alt="" width={42} height={52} />
            ) : (
              <AdminIcon name="products" />
            )}
          </div>
          <div>
            <button
              className="admin-text-link admin-strong"
              onClick={() => onNavigate?.("products/edit/" + row.id)}
            >
              {row.title}
            </button>
          </div>
        </div>
      ),
    },
    {
      key: "sku",
      label: "SKU",
      width: "116px",
      render: (row) => <code className="admin-product-sku">{row.sku}</code>,
    },
    { key: "categoryName", label: "Category" },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.isActive ? "active" : "draft"} />
      ),
    },
    {
      key: "stock",
      label: "Inventory",
      render: (row) => (
        <span
          className={`admin-inventory-badge ${row.stock === 0 ? "is-out" : row.stock <= 10 ? "is-low" : "is-in"}`}
        >
          {row.stock === 0 ? (
            "Out of stock"
          ) : (
            <>
              {row.stock.toLocaleString("en-IN")} in stock
              {row.stock <= 10 && " · Low stock"}
            </>
          )}
        </span>
      ),
    },
    {
      key: "effectivePrice",
      label: "Price",
      render: (row) => adminMoney(row.salePrice || row.price),
    },
    {
      key: "unitsSold",
      label: "Units sold",
      render: (row) => Number(row.unitsSold || 0).toLocaleString("en-IN"),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => onNavigate?.("products/edit/" + row.id)}
          >
            Edit
          </button>
          {records.actions(row, row.title)}
        </div>
      ),
    },
  ];
  return (
    <AdminPage
      title="Products"
      description="Manage your catalog, inventory, pricing, and product availability."
      actions={
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => onNavigate?.("products/new")}
        >
          <AdminIcon name="plus" />
          Add product
        </button>
      }
    >
      {records.notice}
      {error ? (
        <AdminError message={error} retry={reload} />
      ) : (
        <>
          <AdminFilters>
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholder="Search products or SKU"
            />
            <select
              aria-label="Product status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="published">Active</option>
              <option value="draft">Draft</option>
            </select>
            {categories.length > 1 && (
              <select
                aria-label="Category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </AdminFilters>
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage={
              search || status !== "all" || category !== "all"
                ? "No products match these filters."
                : "Add your first product to start your catalogue."
            }
          />
        </>
      )}
      {records.dialog}
    </AdminPage>
  );
}
