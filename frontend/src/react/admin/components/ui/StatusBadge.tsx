import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variantMap: Record<string, BadgeVariant> = {
  // Orders
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  // Appointments
  upcoming: 'info',
  completed: 'success',
  // Reviews
  approved: 'success',
  rejected: 'danger',
  // Payments
  paid: 'success',
  failed: 'danger',
  refunded: 'warning',
  // Products
  active: 'success',
  inactive: 'neutral',
};

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const v = variant || variantMap[status] || 'neutral';
  return (
    <span className={`admin-badge admin-badge-${v}`}>
      {status}
    </span>
  );
};
