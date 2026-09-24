import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-sans-clean text-[11px] uppercase tracking-[0.18em] ' +
  'min-h-[44px] px-6 cursor-pointer transition-colors duration-200 focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[#4A0E17] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-[#4A0E17] text-white hover:bg-[#66141F]',
  secondary: 'border border-[#4A0E17] text-[#4A0E17] hover:bg-[#FAF2F3]',
  ghost: 'text-[#4A0E17] hover:bg-[#FAF2F3]',
};

const sizes: Record<Size, string> = {
  md: 'px-8 py-3',
  sm: 'px-5 py-2 min-h-[40px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}) => (
  <button
    className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading && (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    )}
    {children}
  </button>
);
