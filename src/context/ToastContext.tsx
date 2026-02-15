/**
 * ToastContext - Global toast notification system
 * Provides toast display functionality to the entire application tree
 * Follows the DarkModeContext pattern: createContext + Provider + useHook
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider - Wraps application to provide toast notifications
 * Must be placed inside DarkModeProvider (for dark mode classes)
 * Renders a fixed-position container for toast items at bottom-right
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Auto-dismiss toasts after 4 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dismissToast(toast.id);
      }, 4000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, dismissToast]);

  const colorMap = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container - fixed bottom-right, above modals (z-[60]) */}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 max-w-sm px-4 py-3 rounded-lg shadow-lg ${colorMap[toast.type]}`}
            role="alert"
          >
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Custom hook to access toast functionality
 * Must be called from within a component wrapped by ToastProvider
 * @throws Error if used outside of ToastProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
