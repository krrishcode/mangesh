import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = '#4A0E17' }) => (
  <div className="admin-stat-card">
    <div className="admin-stat-card-icon" style={{ background: `${color}10`, color }}>
      {icon}
    </div>
    <div className="admin-stat-card-label">{label}</div>
    <div className="admin-stat-card-value">{value}</div>
  </div>
);
