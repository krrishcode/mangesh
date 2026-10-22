import type { FC } from 'react';

export const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const normalized = status.toLowerCase();
  const tone = ['delivered', 'completed'].includes(normalized) ? 'complete'
    : normalized === 'cancelled' ? 'neutral' : normalized === 'pending' ? 'pending' : 'active';
  return <span className={`account-badge ${tone}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};
