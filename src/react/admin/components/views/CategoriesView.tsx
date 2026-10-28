import { useState, type FormEvent } from "react";
import { fetchApi } from "../../../../lib/api";
import { AdminError, useAdminAction, useAdminData } from "../../useAdminData";
import { AdminPage, AdminFilters, AdminSearch } from "../ui/AdminPage";
import { DataTable, type Column } from "../ui/DataTable";
import { AdminModal } from "../ui/AdminModal";
import { FormField } from "../ui/FormField";
import { AdminIcon } from "../ui/AdminIcon";
import {
  useRecordLifecycle,
  type LifecycleRecord,
} from "../ui/RecordLifecycle";
interface Category extends LifecycleRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}
export function CategoriesView() {
  const { data, loading, error, reload } =
    useAdminData<Category[]>("/admin/categories");
  const action = useAdminAction();
  const records = useRecordLifecycle("categories", reload);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    slug: "",
    description: "",
  });
  function edit(row?: Category) {
    action.clearError();
    setForm(
      row
        ? { ...row, description: row.description || "" }
        : { id: 0, name: "", slug: "", description: "" },
    );
    setOpen(true);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    await action.run(async () => {
      await fetchApi("/admin/categories" + (form.id ? "/" + form.id : ""), {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
        }),
      });
      setOpen(false);
      reload();
    });
  }
  const columns: Column<Category>[] = [
    {
      key: "name",
      label: "Category",
      render: (row) => (
        <div className="admin-strong">
          {row.name}
          <small>/{row.slug}</small>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="admin-muted">{row.description || "—"}</span>
      ),
    },
    { key: "productCount", label: "Products" },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => edit(row)}
          >
            Edit
          </button>
          {records.actions(row, row.name)}
        </div>
      ),
    },
  ];
  const rows = (data ?? []).filter((row) =>
    row.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <AdminPage
      title="Categories"
      description="Organise products into collections."
      actions={
        <button className="admin-btn admin-btn-primary" onClick={() => edit()}>
          <AdminIcon name="plus" />
          Add category
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
              placeholder="Search categories"
            />
          </AdminFilters>
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage="No categories found."
          />
        </>
      )}
      <AdminModal
        title={form.id ? "Edit category" : "Add category"}
        isOpen={open}
        busy={action.busy}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save}>
          {action.error && <AdminError message={action.error} />}
          <FormField label="Name">
            <input
              required
              maxLength={255}
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm({
                  ...form,
                  name,
                  ...(!form.id
                    ? {
                        slug: name
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      }
                    : {}),
                });
              }}
            />
          </FormField>
          <FormField label="URL slug">
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={255}
              value={form.slug}
              onChange={(event) =>
                setForm({ ...form, slug: event.target.value })
              }
            />
            <small>Use lowercase letters, numbers and hyphens.</small>
          </FormField>
          <FormField label="Description (optional)">
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </FormField>
          <button className="admin-btn admin-btn-primary" type="submit">
            {action.busy ? "Saving…" : "Save category"}
          </button>
        </form>
      </AdminModal>
      {records.dialog}
    </AdminPage>
  );
}
