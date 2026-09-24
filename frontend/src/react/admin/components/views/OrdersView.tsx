import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { DataTable, type Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  items_count: number;
  items: { id: number; title: string; quantity: number; price: number }[];
  created_at: string;
}

const statusTabs = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetchApi<{ data: Order[] }>('/admin/orders')
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetchApi(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  };

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  const columns: Column<Order>[] = [
    { key: 'order_number', label: 'Order', render: (o) => <span style={{ fontWeight: 500 }}>{o.order_number}</span> },
    { key: 'customer_name', label: 'Customer', render: (o) => (
      <div>
        <div>{o.customer_name}</div>
        <div style={{ fontSize: 11, color: '#78716C' }}>{o.customer_email}</div>
      </div>
    )},
    { key: 'items_count', label: 'Items', width: '70px' },
    { key: 'total_amount', label: 'Amount', render: (o) => `₹${o.total_amount.toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: (o) => (
      <select
        className="admin-select"
        value={o.status}
        onChange={(e) => updateStatus(o.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
      >
        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
    )},
    { key: 'created_at', label: 'Date', render: (o) => (
      <span style={{ fontSize: 12, color: '#78716C' }}>
        {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    )},
    { key: 'expand', label: '', sortable: false, width: '40px', render: (o) => (
      <button
        className="admin-btn admin-btn-ghost admin-btn-sm"
        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === o.id ? null : o.id); }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: expandedId === o.id ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Orders</h2>
        <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>{orders.length} total orders</p>
      </div>

      <div className="admin-tabs">
        {statusTabs.map(tab => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== 'all' && (
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>
                ({orders.filter(o => o.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No orders found" />

      {/* Expanded order details */}
      {expandedId && (() => {
        const order = orders.find(o => o.id === expandedId);
        if (!order || order.items.length === 0) return null;
        return (
          <div style={{ background: 'white', border: '1px solid var(--admin-border)', borderRadius: 10, padding: 20, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              {order.order_number} — Line Items
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
};
