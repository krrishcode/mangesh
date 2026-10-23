import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { StatCard } from '../ui/StatCard';
import { StatusBadge } from '../ui/StatusBadge';

interface DashboardData {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    pendingOrders: number;
    lowStockItems: number;
  };
  recentOrders: {
    id: number;
    order_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[];
}

interface DashboardViewProps {
  onNavigate?: (route: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ data: DashboardData }>('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => setData({
        stats: { totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0, pendingOrders: 0, lowStockItems: 0 },
        recentOrders: [],
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="admin-stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="admin-stat-card">
              <div className="admin-skeleton" style={{ width: 36, height: 36, marginBottom: 12, borderRadius: 8 }} />
              <div className="admin-skeleton" style={{ width: '60%', height: 12, marginBottom: 8 }} />
              <div className="admin-skeleton" style={{ width: '40%', height: 28 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const orders = data?.recentOrders ?? [];

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Executive Dashboard</h2>
          <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>Real-time business telemetry and operations</p>
        </div>
        {onNavigate && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => onNavigate('orders')}>
              View Orders
            </button>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => onNavigate('products')}>
              Add Product
            </button>
          </div>
        )}
      </div>

      <div className="admin-stats-grid">
        <div onClick={() => onNavigate?.('orders')} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            color="#16A34A"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
        </div>
        <div onClick={() => onNavigate?.('orders')} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
          <StatCard
            label="Total Orders"
            value={stats?.totalOrders ?? 0}
            color="#2563EB"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
          />
        </div>
        <div onClick={() => onNavigate?.('products')} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
          <StatCard
            label="Total Products"
            value={stats?.totalProducts ?? 0}
            color="#7C3AED"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}
          />
        </div>
        <div onClick={() => onNavigate?.('customers')} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
          <StatCard
            label="Total Customers"
            value={stats?.totalCustomers ?? 0}
            color="#0891B2"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          />
        </div>
        <div onClick={() => onNavigate?.('orders')} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
          <StatCard
            label="Pending Orders"
            value={stats?.pendingOrders ?? 0}
            color="#D97706"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
        </div>
        <div onClick={() => onNavigate?.('products')} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
          <StatCard
            label="Low Stock Items"
            value={stats?.lowStockItems ?? 0}
            color="#DC2626"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">Recent Orders</div>
        </div>
        {orders.length === 0 ? (
          <div className="admin-empty">
            <p>No orders yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 500 }}>{o.order_number}</td>
                    <td>{o.customer_name}</td>
                    <td>₹{o.total_amount.toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: '#78716C', fontSize: 12 }}>
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
