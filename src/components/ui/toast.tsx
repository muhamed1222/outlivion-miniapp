'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-status-success text-white';
      case 'error':
        return 'bg-status-error text-white';
      case 'warning':
        return 'bg-status-warning text-white';
      case 'info':
      default:
        return 'bg-status-info text-white';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '\u2713'; // ✓
      case 'error':
        return '\u2715'; // ✕
      case 'warning':
        return '\u26A0'; // ⚠
      case 'info':
      default:
        return '\u2139'; // ℹ
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              ${getToastStyles(toast.type)}
              px-4 py-3 rounded-lg shadow-lg
              flex items-center gap-3
              animate-slide-in
              cursor-pointer
              transition-all duration-300 hover:scale-105
            `}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-lg font-bold">{getToastIcon(toast.type)}</span>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              {'\u2715'}
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

