import React from 'react';

const statusColors: Record<string, string> = {
  upcoming: 'bg-primary-subtle text-primary-foreground border border-primary/20',
  completed: 'bg-[#F0FDF4] text-[#166534] border border-[#166534]/20',
  cancelled: 'bg-[#F5F5F4] text-[#78716C] border border-[#78716C]/20',
  pending: 'bg-[#FFFBEB] text-[#92400E] border border-[#92400E]/20',
  processing: 'bg-[#EFF6FF] text-[#1E40AF] border border-[#1E40AF]/20',
  shipped: 'bg-[#F0FDF4] text-[#166534] border border-[#166534]/20',
  delivered: 'bg-[#F0FDF4] text-[#166534] border border-[#166534]/20',
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 text-[10px] font-portal-sans font-medium uppercase tracking-widest ${
      statusColors[status.toLowerCase()] ?? 'bg-[#F5F5F4] text-[#78716C]'
    }`}
  >
    {status}
  </span>
);