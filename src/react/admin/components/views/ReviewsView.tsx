import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { DataTable, type Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';

interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: string;
  customerName: string | null;
  productTitle: string | null;
}

const statusTabs = ['all', 'pending', 'approved', 'rejected'];

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const load = () => {
    setLoading(true);
    fetchApi<{ data: Review[] }>('/admin/reviews')
      .then(res => setReviews(res.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetchApi(`/admin/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  };

  const filtered = activeTab === 'all' ? reviews : reviews.filter(r => r.status === activeTab);

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'inline-flex', gap: 2, color: '#D97706' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={star <= rating ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  const columns: Column<Review>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    {
      key: 'productTitle',
      label: 'Product',
      render: (r) => (
        <span style={{ fontWeight: 500, fontSize: 13 }}>
          {r.productTitle ?? 'Unknown Product'}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (r) => (
        <span style={{ fontSize: 13, color: '#44403C' }}>
          {r.customerName ?? 'Anonymous'}
        </span>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      width: '110px',
      render: (r) => renderStars(r.rating),
    },
    {
      key: 'title',
      label: 'Review',
      render: (r) => (
        <div style={{ maxWidth: 320 }}>
          {r.title && <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{r.title}</div>}
          {r.body && (
            <p style={{ margin: 0, fontSize: 12, color: '#78716C', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {r.body}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      width: '120px',
      render: (r) => (
        <span style={{ fontSize: 12, color: '#78716C' }}>
          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '150px',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {r.status !== 'approved' && (
            <button
              className="admin-btn admin-btn-sm admin-btn-secondary"
              style={{ color: '#16A34A', borderColor: '#BBF7D0' }}
              onClick={() => updateStatus(r.id, 'approved')}
            >
              Approve
            </button>
          )}
          {r.status !== 'rejected' && (
            <button
              className="admin-btn admin-btn-sm admin-btn-danger"
              onClick={() => updateStatus(r.id, 'rejected')}
            >
              Reject
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Reviews & Ratings</h2>
        <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>Moderate customer feedback and product reviews</p>
      </div>

      <div className="admin-tabs">
        {statusTabs.map(tab => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No reviews found" />
    </div>
  );
};
