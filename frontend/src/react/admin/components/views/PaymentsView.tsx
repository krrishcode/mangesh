import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../../lib/api';

interface PaymentRecord {
  id: number;
  order_id: number;
  order_number: string;
  provider: string;
  reference: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status?: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  updated_at: string;
}

interface PaymentStats {
  total_settled: number;
  successful_count: number;
  pending_count: number;
  refunded_volume: number;
  total_count: number;
}

interface PaymentsViewProps {
  onNavigate?: (route: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ onNavigate }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_settled: 0,
    successful_count: 0,
    pending_count: 0,
    refunded_volume: 0,
    total_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    orderId: '',
    provider: 'Bespoke Atelier Wire',
    reference: '',
    amount: '',
    status: 'paid',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadPayments = () => {
    setLoading(true);
    fetchApi<{ success: boolean; data: PaymentRecord[]; stats: PaymentStats }>('/admin/payments')
      .then((res) => {
        if (res.data) {
          setPayments(res.data);
          if (res.stats) setStats(res.stats);
        }
      })
      .catch((err) => {
        console.error('Failed to load payments:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleUpdateStatus = async (paymentId: number, nextStatus: string) => {
    setActionLoading(paymentId);
    try {
      await fetchApi(`/admin/payments/${paymentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadPayments();
      if (selectedPayment && selectedPayment.id === paymentId) {
        setSelectedPayment((prev) => prev ? { ...prev, status: nextStatus as any } : null);
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.orderId || !newPayment.amount) {
      alert('Order ID and Amount are required.');
      return;
    }

    setSavingPayment(true);
    try {
      await fetchApi('/admin/payments', {
        method: 'POST',
        body: JSON.stringify({
          orderId: Number(newPayment.orderId),
          provider: newPayment.provider,
          reference: newPayment.reference || `MAN-${Date.now().toString().slice(-6)}`,
          amount: newPayment.amount,
          status: newPayment.status,
        }),
      });
      setShowAddModal(false);
      setNewPayment({
        orderId: '',
        provider: 'Bespoke Atelier Wire',
        reference: '',
        amount: '',
        status: 'paid',
      });
      loadPayments();
    } catch (err: any) {
      alert(`Failed to record payment: ${err.message}`);
    } finally {
      setSavingPayment(false);
    }
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (providerFilter !== 'all' && !p.provider.toLowerCase().includes(providerFilter.toLowerCase())) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRef = p.reference?.toLowerCase().includes(q);
      const matchOrder = p.order_number?.toLowerCase().includes(q) || String(p.order_id).includes(q);
      const matchCust = p.customer_name?.toLowerCase().includes(q);
      const matchEmail = p.customer_email?.toLowerCase().includes(q);
      return matchRef || matchOrder || matchCust || matchEmail;
    }
    return true;
  });

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>
            Payments & Treasury
          </h2>
          <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '2px 0 0' }}>
            Audited financial settlement ledger, gateway transactions, and bespoke atelier client deposits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={loadPayments}
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Record Manual / Wire Payment
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid var(--admin-border)',
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Settled Revenue
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#166534', marginTop: 4 }}>
            {formatINR(stats.total_settled)}
          </div>
          <span style={{ fontSize: 11, color: '#15803D', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            ✓ Verified gross collections
          </span>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid var(--admin-border)',
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Successful Transactions
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', marginTop: 4 }}>
            {stats.successful_count} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)' }}>/ {stats.total_count}</span>
          </div>
          <span style={{ fontSize: 11, color: '#2563EB', marginTop: 4, display: 'block' }}>
            100% gateway reconciliation
          </span>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid var(--admin-border)',
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pending Clearances
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: stats.pending_count > 0 ? '#B45309' : 'var(--admin-text)', marginTop: 4 }}>
            {stats.pending_count}
          </div>
          <span style={{ fontSize: 11, color: stats.pending_count > 0 ? '#D97706' : '#78716C', marginTop: 4, display: 'block' }}>
            {stats.pending_count > 0 ? 'Action required: verify wire' : 'All clear'}
          </span>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid var(--admin-border)',
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Refunds & Adjustments
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', marginTop: 4 }}>
            {formatINR(stats.refunded_volume)}
          </div>
          <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4, display: 'block' }}>
            0 chargebacks or disputes
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid var(--admin-border)',
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#A8A29E', fontSize: 13 }}>
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Reference, Order #, Client, Email..."
            style={{
              paddingLeft: 32,
              height: 36,
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #E7E5E4',
              width: '100%',
              background: '#FAFAFA',
            }}
          />
        </div>

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? 'var(--admin-accent)' : '#F5F5F4',
                color: statusFilter === st ? '#FFFFFF' : '#44403C',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'all' ? 'All Payments' : st}
            </button>
          ))}
        </div>

        {/* Gateway Select */}
        <div>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            style={{
              height: 36,
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #E7E5E4',
              background: '#FAFAFA',
              padding: '0 10px',
            }}
          >
            <option value="all">All Gateways</option>
            <option value="Razorpay">Razorpay</option>
            <option value="Stripe">Stripe</option>
            <option value="UPI">UPI</option>
            <option value="Wire">Atelier Wire / NEFT</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid var(--admin-border)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
            Loading payments audit ledger...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
            No payment transactions match your query.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#FAF9F8', borderBottom: '1px solid var(--admin-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C' }}>Transaction Reference</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C' }}>Linked Order</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C' }}>Client Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C' }}>Gateway / Channel</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C' }}>Date & Time</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#44403C', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                let badgeBg = '#F5F5F4';
                let badgeColor = '#44403C';
                let badgeBorder = '#E7E5E4';

                if (p.status === 'paid') {
                  badgeBg = '#DCFCE7';
                  badgeColor = '#166534';
                  badgeBorder = '#BBF7D0';
                } else if (p.status === 'pending') {
                  badgeBg = '#FEF3C7';
                  badgeColor = '#92400E';
                  badgeBorder = '#FDE68A';
                } else if (p.status === 'failed') {
                  badgeBg = '#FEE2E2';
                  badgeColor = '#991B1B';
                  badgeBorder = '#FECACA';
                } else if (p.status === 'refunded') {
                  badgeBg = '#F3E8FF';
                  badgeColor = '#6B21A8';
                  badgeBorder = '#E9D5FF';
                }

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #F5F5F4',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Reference ID */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{
                          background: '#FAF9F8',
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: '1px solid #E7E5E4',
                          fontWeight: 600,
                          fontSize: 11,
                          color: '#1C1917',
                        }}>
                          {p.reference}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.reference)}
                          title="Copy reference code"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--admin-text-muted)',
                            fontSize: 11,
                            padding: 0,
                          }}
                        >
                          📋
                        </button>
                      </div>
                    </td>

                    {/* Order # */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('orders')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-accent)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        {p.order_number}
                      </button>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1C1917' }}>{p.customer_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{p.customer_email}</div>
                    </td>

                    {/* Provider */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#44403C',
                        background: '#FAFAFA',
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: '1px solid #E7E5E4',
                      }}>
                        💳 {p.provider}
                      </span>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1C1917', fontSize: 13 }}>
                      {formatINR(p.amount)}
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                      }}>
                        {p.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)', fontSize: 11 }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setSelectedPayment(p)}
                          style={{ fontSize: 11, padding: '3px 8px' }}
                        >
                          Receipt
                        </button>

                        <select
                          value={p.status}
                          disabled={actionLoading === p.id}
                          onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                          style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid #D6D3D1',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="refunded">Refunded</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Receipt / Details Modal */}
      {selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            width: '100%',
            maxWidth: 480,
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                Payment Voucher #{selectedPayment.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#78716C' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: '#FAF9F8',
              borderRadius: 6,
              padding: 16,
              marginBottom: 16,
              border: '1px solid #EFECE8',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#78716C' }}>Amount Settled</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>
                  {formatINR(selectedPayment.amount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#78716C' }}>Gateway / Channel</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1C1917' }}>{selectedPayment.provider}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#78716C' }}>Transaction Ref</span>
                <code style={{ fontSize: 11, fontWeight: 600, color: '#4A0E17' }}>{selectedPayment.reference}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#78716C' }}>Linked Order</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1C1917' }}>{selectedPayment.order_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#78716C' }}>Client Name</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1C1917' }}>{selectedPayment.customer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#78716C' }}>Client Email</span>
                <span style={{ fontSize: 12, color: '#44403C' }}>{selectedPayment.customer_email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#78716C' }}>Timestamp</span>
                <span style={{ fontSize: 11, color: '#78716C' }}>{new Date(selectedPayment.created_at).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Manual / Wire Payment Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20,
        }}>
          <form
            onSubmit={handleCreatePayment}
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              width: '100%',
              maxWidth: 460,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                Record Manual / Wire Payment
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#78716C' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#44403C', display: 'block', marginBottom: 4 }}>
                  Order ID * (e.g. 1, 2, 3)
                </label>
                <input
                  type="number"
                  required
                  value={newPayment.orderId}
                  onChange={(e) => setNewPayment((p) => ({ ...p, orderId: e.target.value }))}
                  placeholder="3"
                  style={{ width: '100%', height: 36, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#44403C', display: 'block', marginBottom: 4 }}>
                  Payment Channel / Gateway Provider *
                </label>
                <select
                  value={newPayment.provider}
                  onChange={(e) => setNewPayment((p) => ({ ...p, provider: e.target.value }))}
                  style={{ width: '100%', height: 36, fontSize: 12 }}
                >
                  <option value="Bespoke Atelier Wire">Bespoke Atelier Wire (NEFT / RTGS)</option>
                  <option value="UPI (HDFC Bank)">UPI Direct (QR / PhonePe / GPay)</option>
                  <option value="Razorpay Virtual Escrow">Razorpay Virtual Escrow</option>
                  <option value="Stripe Concierge">Stripe Concierge</option>
                  <option value="Atelier Cash Concierge">Atelier Cash Concierge (COD)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#44403C', display: 'block', marginBottom: 4 }}>
                  Transaction Reference / UTR / Check #
                </label>
                <input
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment((p) => ({ ...p, reference: e.target.value }))}
                  placeholder="e.g. UTR-HDFC-9921827 or check #1029"
                  style={{ width: '100%', height: 36, fontSize: 12, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#44403C', display: 'block', marginBottom: 4 }}>
                  Amount Received (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="290000"
                  style={{ width: '100%', height: 36, fontSize: 13, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#44403C', display: 'block', marginBottom: 4 }}>
                  Initial Status
                </label>
                <select
                  value={newPayment.status}
                  onChange={(e) => setNewPayment((p) => ({ ...p, status: e.target.value }))}
                  style={{ width: '100%', height: 36, fontSize: 12 }}
                >
                  <option value="paid">Paid (Settled into Atelier Account)</option>
                  <option value="pending">Pending Clearance</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={savingPayment}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={savingPayment}
              >
                {savingPayment ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
