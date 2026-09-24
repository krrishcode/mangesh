import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { DataTable, type Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';

interface Appointment {
  id: number;
  location: string;
  occasion: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  customerName: string | null;
  customerEmail: string | null;
}

const statusTabs = ['all', 'upcoming', 'completed', 'cancelled'];

export const AppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const load = () => {
    setLoading(true);
    fetchApi<{ data: Appointment[] }>('/admin/appointments')
      .then(res => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetchApi(`/admin/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  };

  const filtered = activeTab === 'all' ? appointments : appointments.filter(a => a.status === activeTab);

  const columns: Column<Appointment>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'customerName', label: 'Customer', render: (a) => (
      <div>
        <div style={{ fontWeight: 500 }}>{a.customerName ?? 'Unknown'}</div>
        {a.customerEmail && <div style={{ fontSize: 11, color: '#78716C' }}>{a.customerEmail}</div>}
      </div>
    )},
    { key: 'location', label: 'Location' },
    { key: 'occasion', label: 'Occasion' },
    { key: 'scheduledAt', label: 'Scheduled', render: (a) => (
      <span style={{ fontSize: 12 }}>
        {new Date(a.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        <br />
        <span style={{ color: '#78716C' }}>
          {new Date(a.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </span>
    )},
    { key: 'status', label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'actions', label: '', sortable: false, width: '120px', render: (a) => (
      a.status === 'upcoming' ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => updateStatus(a.id, 'completed')}>Complete</button>
          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
        </div>
      ) : null
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Appointments</h2>
        <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>Bespoke consultation bookings</p>
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

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No appointments found" />
    </div>
  );
};
