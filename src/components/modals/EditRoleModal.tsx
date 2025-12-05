/**
 * EditRoleModal Component - Form for editing an existing custom role
 * Features: Pre-fill form, edit description only (name is read-only),
 * delete option, real-time validation, and full a11y support
 */

import { useState, useCallback, useMemo } from 'react';
import { ModalWrapper } from '../ui';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import type { CustomRole } from '../../types';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description?: string) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  currentRole: CustomRole;
}

interface ValidationState {
  description: {
    valid: boolean;
    error: string | null;
  };
}

const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Renders a modal form for editing an existing custom role
 * Role name is read-only to prevent duplicate issues
 * Only description can be edited
 * Provides option to delete the role
 * @param isOpen - Whether modal is open
 * @param onClose - Callback to close modal
 * @param onSubmit - Callback with updated description
 * @param isSubmitting - Whether submission is in progress
 * @param error - Server-side error message to display
 * @param roleId - ID of the role being edited
 * @param currentRole - Current role data to pre-fill
 */
export function EditRoleModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
  currentRole,
}: EditRoleModalProps) {
  const [description, setDescription] = useState(currentRole.description || '');
  const [touched, setTouched] = useState({ description: false });

  // Validate description (optional but has constraints)
  const validateDescription = useCallback(
    (value: string): { valid: boolean; error: string | null } => {
      if (value.length > MAX_DESCRIPTION_LENGTH) {
        return {
          valid: false,
          error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
        };
      }
      return { valid: true, error: null };
    },
    []
  );

  // Compute validation state
  const validationState = useMemo((): ValidationState => {
    return {
      description: touched.description
        ? validateDescription(description)
        : { valid: true, error: null },
    };
  }, [description, touched, validateDescription]);

  // Check if form is valid
  const isFormValid = validationState.description.valid;

  // Check if form has changes
  const hasChanges = description !== (currentRole.description || '');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show validation errors
    setTouched({ description: true });

    if (!isFormValid) {
      return;
    }

    try {
      await onSubmit(description.trim() || undefined);
      // Reset form on success
      setDescription(currentRole.description || '');
      setTouched({ description: false });
    } catch (err) {
      // Error is handled by parent component and displayed via error prop
    }
  };

  const handleClose = () => {
    // Reset form state to current role data
    setDescription(currentRole.description || '');
    setTouched({ description: false });
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      title={`Edit Role: ${currentRole.name}`}
      onClose={handleClose}
      size="md"
      footer={
        <div className="flex gap-3 justify-between">
          {/* Delete button on left */}
          <button
            onClick={() => {
              // This would be handled by parent, but for now we'll keep it disabled
              // The parent component should handle delete via separate dialog
            }}
            disabled
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 flex items-center gap-2"
            aria-label={`Delete role ${currentRole.name}`}
            title="Use the delete button in the role list to delete this role"
          >
            <Trash2 size={16} />
            Delete Role
          </button>

          {/* Action buttons on right */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              aria-label="Cancel editing role"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Update role"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Update Role
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Role Name - Read Only */}
        <div>
          <label
            htmlFor="role-name-readonly"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Role Name
            <span className="text-slate-500 font-normal"> (read-only)</span>
          </label>
          <input
            id="role-name-readonly"
            type="text"
            value={currentRole.name}
            disabled
            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
            aria-label={`Role name: ${currentRole.name}`}
            title="Role name cannot be changed to prevent duplicates"
          />
          <p className="text-xs text-slate-500 mt-2">
            Role names cannot be changed to prevent duplicate entries
          </p>
        </div>

        {/* Description Input */}
        <div>
          <label
            htmlFor="role-description"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Description
          </label>
          <div className="relative">
            <textarea
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              placeholder="Describe this role and its responsibilities..."
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors resize-none ${
                touched.description && validationState.description.error
                  ? 'border-red-300 bg-red-50 focus:ring-red-500'
                  : touched.description && validationState.description.valid && description.trim()
                    ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-500'
                    : 'border-slate-300 focus:ring-indigo-500'
              }`}
              aria-invalid={touched.description && !!validationState.description.error}
              aria-describedby={
                touched.description && validationState.description.error
                  ? 'description-error'
                  : undefined
              }
            />
          </div>
          {touched.description && validationState.description.error && (
            <p id="description-error" className="text-sm text-red-600 mt-2">
              {validationState.description.error}
            </p>
          )}
          <div className="text-xs text-slate-500 mt-2">
            {description.length}/{MAX_DESCRIPTION_LENGTH} characters
            {hasChanges && (
              <span className="ml-2 text-amber-600">
                • You have unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* Metadata Info */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(currentRole.createdAt))}
          </div>
          {currentRole.updatedAt && (
            <div>
              <span className="font-medium">Last updated:</span>{' '}
              {new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(currentRole.updatedAt))}
            </div>
          )}
          {currentRole.createdBy && (
            <div>
              <span className="font-medium">Created by:</span> {currentRole.createdBy}
            </div>
          )}
        </div>
      </form>
    </ModalWrapper>
  );
}
