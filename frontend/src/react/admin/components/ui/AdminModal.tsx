import React from 'react';

interface AdminModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string | number;
}

export const AdminModal: React.FC<AdminModalProps> = ({ title, isOpen, onClose, children, footer, maxWidth }) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal" style={maxWidth ? { maxWidth } : undefined}>
        <div className="admin-modal-header">
          <h2>{title}</h2>
          <button className="admin-btn-ghost admin-btn" onClick={onClose} style={{ padding: '4px 8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
        {footer && (
          <div className="admin-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
