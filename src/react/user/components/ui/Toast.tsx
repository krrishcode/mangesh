import React, { useState, useCallback, useEffect } from 'react';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let nextId = 1;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

export const ToastContainer: React.FC<{
  toasts: ToastItem[];
  removeToast: (id: number) => void;
}> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      className={`pointer-events-auto flex items-start gap-3 px-5 py-4 shadow-lg border ${
        isSuccess
          ? 'bg-[#F0FDF4] text-[#166534] border-[#166534]/20'
          : 'bg-[#FEF2F2] text-[#991B1B] border-[#991B1B]/20'
      }`}
    >
      {isSuccess ? (
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <p className="font-portal-sans text-sm font-light flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-current opacity-50 hover:opacity-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -m-2"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};