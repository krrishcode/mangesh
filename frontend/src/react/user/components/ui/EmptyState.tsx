import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, children }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-[#EAE3DB] bg-white">
    {icon ? (
      <div className="mb-5 text-[#C5A880]">{icon}</div>
    ) : (
      <div className="mb-5">
        <svg className="w-10 h-10 text-[#C5A880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
    )}
    <h3 className="font-portal-serif text-lg font-medium text-[#1C1917] mb-2">{title}</h3>
    <p className="font-portal-sans text-sm font-light text-[#78716C] max-w-xs">{message}</p>
    {children && <div className="mt-6">{children}</div>}
  </div>
);