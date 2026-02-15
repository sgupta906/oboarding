/**
 * RoleModal Component - Unified create/edit modal for custom roles
 * Features: Real-time validation, character counter, error handling,
 * loading state, change detection (edit), and full a11y support
 */

import { useState, useCallback, useMemo } from 'react';
import { ModalWrapper } from '../ui';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { MIN_ROLE_NAME_LENGTH, MAX_ROLE_NAME_LENGTH, ROLE_NAME_PATTERN } from '../../types';
import type { CustomRole } from '../../types';

interface RoleModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  currentRole?: CustomRole;
}

interface ValidationState {
  name: {
    valid: boolean;
    error: string | null;
  };
  description: {
    valid: boolean;
    error: string | null;
  };
}

const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Renders a modal form for creating or editing custom roles
 * In create mode: editable name + description, validation, form hints
 * In edit mode: read-only name, editable description, metadata, change detection
 */
export function RoleModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
  currentRole,
}: RoleModalProps) {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(isEdit ? '' : '');
  const [description, setDescription] = useState(
    isEdit && currentRole ? currentRole.description || '' : ''
  );
  const [touched, setTouched] = useState({ name: false, description: false });

  // Validate role name (create mode only)
  const validateName = useCallback((value: string): { valid: boolean; error: string | null } => {
    if (!value.trim()) {
      return { valid: false, error: 'Role name is required' };
    }
    if (value.trim().length < MIN_ROLE_NAME_LENGTH) {
      return {
        valid: false,
        error: `Role name must be at least ${MIN_ROLE_NAME_LENGTH} characters`,
      };
    }
    if (value.trim().length > MAX_ROLE_NAME_LENGTH) {
      return {
        valid: false,
        error: `Role name cannot exceed ${MAX_ROLE_NAME_LENGTH} characters`,
      };
    }
    if (!ROLE_NAME_PATTERN.test(value)) {
      return {
        valid: false,
        error: 'Role name can only contain letters, numbers, spaces, and hyphens',
      };
    }
    return { valid: true, error: null };
  }, []);

  // Validate description
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
      name: !isEdit && touched.name ? validateName(name) : { valid: true, error: null },
      description: touched.description
        ? validateDescription(description)
        : { valid: true, error: null },
    };
  }, [name, description, touched, validateName, validateDescription, isEdit]);

  // Check if form is valid
  const isFormValid = isEdit
    ? validationState.description.valid
    : validationState.name.valid && validationState.description.valid && name.trim().length > 0;

  // Check if form has changes (edit mode only)
  const hasChanges = isEdit ? description !== (currentRole?.description || '') : true;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ name: true, description: true });

    if (!isFormValid) {
      return;
    }

    try {
      const submitName = isEdit ? currentRole!.name : name.trim();
      await onSubmit(submitName, description.trim() || undefined);
      // Reset form on success
      if (isEdit) {
        setDescription(currentRole?.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setTouched({ name: false, description: false });
    } catch {
      // Error is handled by parent component and displayed via error prop
    }
  };

  const handleClose = () => {
    if (isEdit) {
      setDescription(currentRole?.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setTouched({ name: false, description: false });
    onClose();
  };

  const title = isEdit ? `Edit Role: ${currentRole?.name}` : 'Create New Role';

  const footer = isEdit ? (
    <div className="flex gap-3 justify-between">
      {/* Delete button on left */}
      <button
        onClick={() => {}}
        disabled
        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 flex items-center gap-2"
        aria-label={`Delete role ${currentRole?.name}`}
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
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          aria-label="Cancel editing role"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid || !hasChanges}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
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
  ) : (
    <div className="flex gap-3 justify-end">
      <button
        onClick={handleClose}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        aria-label="Cancel creating role"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !isFormValid}
        className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        aria-label="Create role"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            Create Role
          </>
        )}
      </button>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      title={title}
      onClose={handleClose}
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Role Name Input */}
        {isEdit ? (
          /* Edit mode: read-only name */
          <div>
            <label
              htmlFor="role-name-readonly"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              Role Name
              <span className="text-slate-500 dark:text-slate-400 font-normal"> (read-only)</span>
            </label>
            <input
              id="role-name-readonly"
              type="text"
              value={currentRole?.name || ''}
              disabled
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed"
              aria-label={`Role name: ${currentRole?.name}`}
              title="Role name cannot be changed to prevent duplicates"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Role names cannot be changed to prevent duplicate entries
            </p>
          </div>
        ) : (
          /* Create mode: editable name */
          <div>
            <label
              htmlFor="role-name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              Role Name <span className="text-red-500" aria-label="required">*</span>
            </label>
            <div className="relative">
              <input
                id="role-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                placeholder="e.g., Senior Developer"
                maxLength={MAX_ROLE_NAME_LENGTH}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors pr-10 ${
                  touched.name && validationState.name.error
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                    : touched.name && validationState.name.valid
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600 focus:ring-emerald-500'
                      : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
                }`}
                required
                aria-required="true"
                aria-invalid={touched.name && !!validationState.name.error}
                aria-describedby={touched.name && validationState.name.error ? 'name-error' : undefined}
              />
              {touched.name && validationState.name.valid && (
                <CheckCircle
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                  aria-hidden="true"
                />
              )}
              {touched.name && validationState.name.error && (
                <AlertCircle
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
                  aria-hidden="true"
                />
              )}
            </div>
            {touched.name && validationState.name.error && (
              <p id="name-error" className="text-sm text-red-600 dark:text-red-400 mt-2">
                {validationState.name.error}
              </p>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {name.length}/{MAX_ROLE_NAME_LENGTH} characters
            </div>
          </div>
        )}

        {/* Description Input */}
        <div>
          <label
            htmlFor="role-description"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Description
            {!isEdit && (
              <span className="text-slate-500 dark:text-slate-400 font-normal"> (optional)</span>
            )}
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors resize-none ${
                touched.description && validationState.description.error
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                  : touched.description && validationState.description.valid && description.trim()
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600 focus:ring-emerald-500'
                    : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
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
            <p id="description-error" className="text-sm text-red-600 dark:text-red-400 mt-2">
              {validationState.description.error}
            </p>
          )}
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {description.length}/{MAX_DESCRIPTION_LENGTH} characters
            {isEdit && hasChanges && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                • You have unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* Create mode: Form Hints */}
        {!isEdit && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Role names should be descriptive and specific to your organization's
              structure (e.g., "Senior Developer", "Sales Manager").
            </p>
          </div>
        )}

        {/* Edit mode: Metadata Info */}
        {isEdit && currentRole && (
          <div className="p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg space-y-2 text-xs text-slate-600 dark:text-slate-300">
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
        )}
      </form>
    </ModalWrapper>
  );
}
