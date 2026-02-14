/**
 * DeleteConfirmationDialog Component - Reusable confirmation dialog for destructive actions
 * Supports custom messaging, loading states, and accessibility features
 */

import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
}

/**
 * Renders a confirmation dialog for destructive actions like delete
 * Supports loading state and customizable button labels
 * Provides clear messaging and proper accessibility attributes
 * @param isOpen - Whether dialog is open
 * @param title - Dialog title
 * @param message - Confirmation message
 * @param confirmLabel - Label for confirm button
 * @param cancelLabel - Label for cancel button
 * @param onConfirm - Callback when confirming action
 * @param onCancel - Callback when canceling action
 * @param isLoading - Whether action is in progress
 * @param isDangerous - Whether to show warning styling
 */
export function DeleteConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = true,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
        role="alertdialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={`inline-flex justify-center items-center w-12 h-12 rounded-full ${
                isDangerous ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
              }`}
            >
              <AlertTriangle
                size={24}
                className={isDangerous ? 'text-red-600' : 'text-amber-600'}
              />
            </div>
          </div>

          {/* Title */}
          <h2 id="dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-50 text-center">
            {title}
          </h2>

          {/* Message */}
          <p id="dialog-description" className="text-slate-600 dark:text-slate-300 text-center text-sm">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="bg-slate-50 dark:bg-slate-700 p-4 border-t border-slate-200 dark:border-slate-600 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
            }`}
            aria-label={confirmLabel}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
