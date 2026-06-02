import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  accentColor?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (type: ToastType, title: string, message?: string, options?: Omit<Toast, 'id' | 'type' | 'title' | 'message'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string, options?: Omit<Toast, 'id' | 'type' | 'title' | 'message'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message, ...options }]);
    setTimeout(() => remove(id), options?.durationMs ?? 4000);
  }, [remove]);

  const success = useCallback((title: string, message?: string) => toast('success', title, message), [toast]);
  const error = useCallback((title: string, message?: string) => toast('error', title, message), [toast]);
  const info = useCallback((title: string, message?: string) => toast('info', title, message), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, remove }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const accentColor = t.accentColor;
  const icons = {
    success: <CheckCircle size={16} className="text-status-active flex-shrink-0" style={{ color: accentColor ?? '#22c55e' }} />,
    error: <AlertCircle size={16} className="flex-shrink-0" style={{ color: accentColor ?? '#ef4444' }} />,
    info: <Info size={16} className="flex-shrink-0" style={{ color: accentColor ?? '#007C73' }} />,
  };
  const borders = {
    success: 'border-l-4 border-l-green-500',
    error: 'border-l-4 border-l-red-500',
    info: 'border-l-4 border-l-[#007C73]',
  };

  return (
    <div
      className={`glass-card p-4 flex items-start gap-3 animate-fade-in ${borders[t.type]} min-w-[280px]`}
      style={{
        animation: 'fadeIn 0.3s ease-out',
        borderLeftColor: accentColor,
        cursor: t.onClick ? 'pointer' : 'default',
      }}
      role={t.onClick ? 'button' : undefined}
      tabIndex={t.onClick ? 0 : undefined}
      onClick={() => {
        t.onClick?.();
        if (t.onClick) onRemove(t.id);
      }}
      onKeyDown={(event) => {
        if (t.onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          t.onClick();
          onRemove(t.id);
        }
      }}
    >
      {icons[t.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{t.title}</p>
        {t.message && <p className="text-xs text-gray-400 mt-0.5">{t.message}</p>}
        {t.actionLabel && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              t.onAction?.();
              onRemove(t.id);
            }}
            className="mt-2 text-[11px] font-bold uppercase tracking-wider transition-colors"
            style={{
              color: accentColor ?? '#007C73',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {t.actionLabel}
          </button>
        )}
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onRemove(t.id);
        }}
        className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
