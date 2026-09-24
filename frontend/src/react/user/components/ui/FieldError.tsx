import React from 'react';

interface FieldErrorProps {
  id?: string;
  children: React.ReactNode;
}

export const FieldError: React.FC<FieldErrorProps> = ({ id, children }) => (
  <p id={id} role="alert" className="mt-1.5 font-portal-sans text-xs text-[#DC2626]">
    {children}
  </p>
);
