import React, { createContext, useCallback, useContext, useState, useEffect, useMemo } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

import Portal from '../components/ui/Portal';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  description?: string;
  copyText?: string;
  duration?: number;
}

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  copyText?: string;
  duration: number;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ToastContextType {
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  warning: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
  confirm: (message: string, options?: Partial<ConfirmState>) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastStyles: Record<ToastType, { icon: React.ReactNode; bar: string; bg: string }> = {
  success: { icon: <Check size={16} />, bar: 'hidden', bg: 'bg-gray-100 text-vutru dark:bg-white/10 dark:text-white' },
  error: { icon: <X size={16} />, bar: 'hidden', bg: 'bg-gray-100 text-vutru dark:bg-white/10 dark:text-white' },
  warning: { icon: <AlertTriangle size={16} />, bar: 'hidden', bg: 'bg-gray-100 text-vutru dark:bg-white/10 dark:text-white' },
  info: { icon: <Info size={16} />, bar: 'hidden', bg: 'bg-gray-100 text-vutru dark:bg-white/10 dark:text-white' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmState & { resolve: (v: boolean) => void }) | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Add a small delay to prevent React batching issues if fired during render
      setTimeout(() => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const title = customEvent.detail || 'Đã có lỗi xảy ra';
        setToasts((prev) => {
          if (prev.some(t => t.title === title && t.type === 'error')) {
            return prev;
          }
          const toast: ToastItem = {
            id,
            type: 'error',
            title,
            duration: 5000,
          };
          setTimeout(() => removeToast(id), 5000);
          return [...prev, toast];
        });
      }, 10);
    };

    window.addEventListener('api-error', handleApiError);
    return () => {
      window.removeEventListener('api-error', handleApiError);
    };
  }, [removeToast]);

  const addToast = useCallback((type: ToastType, title: string, options?: ToastOptions) => {
    setToasts((prev) => {
      if (prev.some((t) => t.title === title && t.type === type)) {
        return prev;
      }
      const id = `toast-${Date.now()}-${Math.random()}`;
      const duration = options?.duration ?? (type === 'error' ? 5000 : 4000);
      const toast: ToastItem = {
        id,
        type,
        title,
        description: options?.description,
        copyText: options?.copyText,
        duration,
      };
      setTimeout(() => removeToast(id), duration);
      return [...prev, toast];
    });
  }, [removeToast]);

  const success = useCallback((title: string, options?: ToastOptions) => addToast('success', title, options), [addToast]);
  const error = useCallback((title: string, options?: ToastOptions) => addToast('error', title, options), [addToast]);
  const warning = useCallback((title: string, options?: ToastOptions) => addToast('warning', title, options), [addToast]);
  const info = useCallback((title: string, options?: ToastOptions) => addToast('info', title, options), [addToast]);

  const confirm = useCallback((message: string, options?: Partial<ConfirmState>) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        title: options?.title || 'Xác nhận',
        message,
        confirmLabel: options?.confirmLabel || 'Xác nhận',
        cancelLabel: options?.cancelLabel || 'Hủy',
        resolve,
      });
    });
  }, []);

  const handleConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, description: 'Đã sao chép vào clipboard!' } : t
        )
      );
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(() => ({ success, error, warning, info, confirm }), [success, error, warning, info, confirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto animate-toast-in bg-white dark:bg-night-surface rounded-2xl shadow-xl border border-gray-100 dark:border-night-border overflow-hidden flex"
            >
              <div className={`w-1.5 shrink-0 ${style.bar}`} />
              <div className="flex-1 p-4 pr-3">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full ${style.bg} flex items-center justify-center text-sm font-bold shrink-0`}>
                    {style.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-vutru text-sm leading-snug">{toast.title}</p>
                    {toast.description && (
                      <p className="text-xs text-vutruNhat mt-1 leading-relaxed">{toast.description}</p>
                    )}
                    {toast.copyText && (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-sm font-bold text-camDam bg-cam/10 px-2.5 py-1 rounded-lg tracking-wider">
                          {toast.copyText}
                        </code>
                        <button
                          onClick={() => handleCopy(toast.copyText!, toast.id)}
                          className="text-xs font-semibold text-cam hover:text-camDam transition-colors"
                        >
                          Sao chép
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-vutruNhat hover:text-vutru text-lg leading-none shrink-0 -mt-0.5"
                    aria-label="Đóng"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <Portal><div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-vutru/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-night-surface rounded-2xl shadow-2xl w-full max-w-md border border-cam/10 dark:border-night-border overflow-hidden animate-toast-in">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-night-border">
              <h3 className="text-lg font-bold text-vutru">{confirmState.title}</h3>
            </div>
            <p className="px-6 py-5 text-sm text-vutruNhat leading-relaxed">{confirmState.message}</p>
            <div className="flex gap-3 px-6 py-4 bg-kem/40 dark:bg-night-elevated border-t border-gray-100 dark:border-night-border">
              <button onClick={() => handleConfirm(false)} className="btn btn-vien flex-1 text-sm">
                {confirmState.cancelLabel}
              </button>
              <button onClick={() => handleConfirm(true)} className="btn btn-chinh flex-1 text-sm">
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div></Portal>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
