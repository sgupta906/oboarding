/**
 * ErrorAlert Component - Shared error message box
 * Used across modals and views for displaying server/validation errors
 */

import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  className?: string;
  showIcon?: boolean;
}

export function ErrorAlert({ message, className = '', showIcon = false }: ErrorAlertProps) {
  return (
    <div
      className={`p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg ${showIcon ? 'flex items-start gap-3' : ''} ${className}`}
      role="alert"
    >
      {showIcon && (
        <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
      )}
      <p className="text-sm font-medium text-red-800 dark:text-red-300">{message}</p>
    </div>
  );
}
