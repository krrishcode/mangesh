import React, { useId } from 'react';
import { FieldError } from './FieldError';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: string[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, id, className = '', ...rest }) => {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className="w-full">
      <label htmlFor={selectId} className="block font-portal-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[#57534E] mb-2">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full min-h-[44px] border-b border-[#EAE3DB] bg-transparent px-0 py-2 text-sm font-light text-[#1C1917] focus:outline-none focus:border-[#4A0E17] transition-colors cursor-pointer ${error ? 'border-[#DC2626]' : ''} ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
};
