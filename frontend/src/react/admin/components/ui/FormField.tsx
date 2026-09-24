import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children, error }) => (
  <div className="admin-field">
    <label>{label}</label>
    {children}
    {error && <div className="admin-field-error">{error}</div>}
  </div>
);
