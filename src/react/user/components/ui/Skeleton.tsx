import React from 'react';

interface SkeletonProps {
  className?: string;
  /** Number of skeleton lines (default 1) */
  lines?: number;
  /** Width per line as a CSS string (e.g. '80%', '200px') */
  widths?: string[];
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1, widths }) => (
  <>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`animate-pulse bg-[#EAE3DB] h-4 rounded ${i > 0 ? 'mt-3' : ''} ${className}`}
        style={{ width: widths?.[i] ?? '100%' }}
      />
    ))}
  </>
);

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="border border-[#EAE3DB] bg-white p-6 space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-5" widths={['60%', '85%', '40%']} />
    ))}
  </div>
);