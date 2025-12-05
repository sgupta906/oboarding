/**
 * CreateRoleModal Component - Form for creating a new custom role
 * Features: Real-time validation, character counter, error handling,
 * loading state, and full a11y support
 */

import { useState, useCallback, useMemo } from 'react';
import { ModalWrapper } from '../ui';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { MIN_ROLE_NAME_LENGTH, MAX_ROLE_NAME_LENGTH, ROLE_NAME_PATTERN } from '../../types';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
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
 * Renders a modal form for creating new custom roles
 * Provides real-time validation feedback and character counting
 * Prevents submission until form is valid
 * @param isOpen - Whether modal is open
 * @param onClose - Callback to close modal
 * @param onSubmit - Callback with role name and description
 * @param isSubmitting - Whether submission is in progress
 * @param error - Server-side error message to display
 */
export function CreateRoleModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
}: CreateRoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState({ name: false, description: false });

  // Validate role name
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
      name: touched.name ? validateName(name) : { valid: true, error: null },
      description: touched.description
        ? validateDescription(description)
        : { valid: true, error: null },
    };
  }, [name, description, touched, validateName, validateDescription]);

  // Check if form is valid
  const isFormValid =
    validationState.name.valid && validationState.description.valid && name.trim().length > 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show validation errors
    setTouched({ name: true, description: true });

    if (!isFormValid) {
      return;
    }

    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      // Reset form on success
      setName('');
      setDescription('');
      setTouched({ name: false, description: false });
    } catch (err) {
      // Error is handled by parent component and displayed via error prop
    }
  };

  const handleClose = () => {
    // Reset form state
    setName('');
    setDescription('');
    setTouched({ name: false, description: false });
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Create New Role"
      onClose={handleClose}
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            aria-label="Cancel creating role"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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

        {/* Role Name Input */}
        <div>
          <label
            htmlFor="role-name"
            className="block text-sm font-medium text-slate-700 mb-2"
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors pr-10 ${
                touched.name && validationState.name.error
                  ? 'border-red-300 bg-red-50 focus:ring-red-500'
                  : touched.name && validationState.name.valid
                    ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-500'
                    : 'border-slate-300 focus:ring-indigo-500'
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
            <p id="name-error" className="text-sm text-red-600 mt-2">
              {validationState.name.error}
            </p>
          )}
          <div className="text-xs text-slate-500 mt-2">
            {name.length}/{MAX_ROLE_NAME_LENGTH} characters
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label
            htmlFor="role-description"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Description
            <span className="text-slate-500 font-normal"> (optional)</span>
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
          </div>
        </div>

        {/* Form Hints */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Role names should be descriptive and specific to your organization's
            structure (e.g., "Senior Developer", "Sales Manager").
          </p>
        </div>
      </form>
    </ModalWrapper>
  );
}
