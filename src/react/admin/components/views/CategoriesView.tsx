import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { DataTable, type Column } from '../ui/DataTable';
import { AdminModal } from '../ui/AdminModal';
import { FormField } from '../ui/FormField';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount?: number;
  createdAt: string;
}

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchApi<{ data: Category[] }>('/admin/categories')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await fetchApi(`/admin/categories/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await fetchApi('/admin/categories', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await fetchApi(`/admin/categories/${id}`, { method: 'DELETE' });
    load();
  };

  const columns: Column<Category>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'name', label: 'Name', render: (c) => <span style={{ fontWeight: 500 }}>{c.name}</span> },
    { key: 'slug', label: 'Slug', render: (c) => <code style={{ fontSize: 12, color: '#78716C', background: '#F5F5F4', padding: '2px 6px', borderRadius: 4 }}>{c.slug}</code> },
    { key: 'description', label: 'Description', render: (c) => (
      <span style={{ color: '#78716C', fontSize: 12 }}>{c.description ? (c.description.length > 50 ? c.description.slice(0, 50) + '…' : c.description) : '—'}</span>
    )},
    { key: 'productCount', label: 'Products', width: '90px', render: (c) => (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: '#F5F5F4',
        color: '#44403C',
      }}>
        {c.productCount ?? 0}
      </span>
    )},
    { key: 'createdAt', label: 'Created', render: (c) => (
      <span style={{ fontSize: 12, color: '#78716C' }}>
        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    )},
    { key: 'actions', label: '', sortable: false, width: '100px', render: (c) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>Edit</button>
        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Categories</h2>
          <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>{categories.length} categories</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Category
        </button>
      </div>

      <DataTable columns={columns} data={categories} loading={loading} emptyMessage="No categories yet" />

      <AdminModal
        title={editingId ? 'Edit Category' : 'Add Category'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
            </button>
          </>
        }
      >
        <FormField label="Name">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
        </FormField>
        <FormField label="Slug">
          <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="category-slug" />
        </FormField>
        <FormField label="Description">
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
        </FormField>
      </AdminModal>
    </div>
  );
};
