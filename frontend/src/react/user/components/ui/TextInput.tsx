import React, { useId } from 'react';
import { FieldError } from './FieldError';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, error, id, className = '', ...rest }) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block font-portal-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[#57534E] mb-2">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full min-h-[44px] border-b border-[#EAE3DB] bg-transparent px-0 py-2 text-sm font-light text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#4A0E17] transition-colors ${error ? 'border-[#DC2626]' : ''} ${className}`}
        {...rest}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
};
