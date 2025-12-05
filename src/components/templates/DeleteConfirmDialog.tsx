/**
 * DeleteConfirmDialog Component - Confirmation modal for template deletion
 * Shows template name and confirms user intent before destructive action
 */

import { AlertCircle } from 'lucide-react';
import { ModalWrapper } from '../ui';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  templateName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

/**
 * Renders a confirmation dialog for deleting a template
 * Shows the template name and requires explicit confirmation
 * @param isOpen - Whether the dialog is open
 * @param templateName - Name of the template to delete
 * @param onConfirm - Callback when user confirms deletion
 * @param onCancel - Callback when user cancels
 * @param isDeleting - Whether deletion is in progress
 */
export function DeleteConfirmDialog({
  isOpen,
  templateName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Delete Template"
      onClose={onCancel}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel delete operation"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            aria-label={`Confirm delete template: ${templateName}`}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      }
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-700 mb-2">
            Are you sure you want to delete <strong>{templateName}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            This action cannot be undone. All instances using this template will be affected.
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
}
