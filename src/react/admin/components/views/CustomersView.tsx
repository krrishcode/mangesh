import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { DataTable, type Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  ordersCount?: number;
  totalSpent?: number;
  createdAt: string;
}

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApi<{ data: Customer[] }>('/admin/customers')
      .then(res => setCustomers(res.data))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const columns: Column<Customer>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'name', label: 'Customer', render: (c) => (
      <div>
        <div style={{ fontWeight: 500 }}>{c.name}</div>
        <div style={{ fontSize: 11, color: '#78716C' }}>{c.email}</div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (c) => c.phone || '—' },
    { key: 'ordersCount', label: 'Orders', width: '80px', render: (c) => (
      <span style={{ fontWeight: 500 }}>{c.ordersCount ?? 0}</span>
    )},
    { key: 'totalSpent', label: 'Total Spent', render: (c) => (
      <span style={{ fontWeight: 600, color: '#16A34A' }}>
        ₹{(c.totalSpent ?? 0).toLocaleString('en-IN')}
      </span>
    )},
    { key: 'role', label: 'Role', width: '90px', render: (c) => (
      <StatusBadge status={c.role} variant={c.role === 'admin' ? 'info' : 'neutral'} />
    )},
    { key: 'createdAt', label: 'Joined', render: (c) => (
      <span style={{ fontSize: 12, color: '#78716C' }}>
        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Customers</h2>
          <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>{customers.length} registered users</p>
        </div>
        <div className="admin-header-search" style={{ width: 220 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: '#78716C', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No customers found" />
    </div>
  );
};
