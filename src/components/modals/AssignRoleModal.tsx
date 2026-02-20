/**
 * AssignRoleModal Component
 * Modal for managers to assign a role, department, and onboarding template
 * to users who signed in via Google OAuth but have no role yet.
 */

import { useState, useMemo, useEffect } from 'react';
import { ModalWrapper } from '../ui';
import { ErrorAlert } from '../ui/ErrorAlert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TemplatePreview } from '../ui/TemplatePreview';
import type { User, CustomRole, Template } from '../../types';
import type { FieldErrors } from '../../utils/validation';

export interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    user: User,
    role: string,
    department: string,
    templateId: string,
  ) => Promise<void>;
  user: User | null;
  isSubmitting: boolean;
  error: string | null;
  roles: CustomRole[];
  rolesLoading: boolean;
  templates: Template[];
  templatesLoading: boolean;
}

export function AssignRoleModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isSubmitting = false,
  error = null,
  roles = [],
  rolesLoading = false,
  templates = [],
  templatesLoading = false,
}: AssignRoleModalProps) {
  // Form state
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [templateId, setTemplateId] = useState('');

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setRole('');
      setDepartment('');
      setTemplateId('');
      setFieldErrors({});
      setHasAttemptedSubmit(false);
    }
  }, [isOpen, user]);

  // Get selected template for preview
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === templateId);
  }, [templates, templateId]);

  // Validation logic
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!role.trim()) {
      errors.role = 'Role is required';
    }

    if (!department.trim()) {
      errors.department = 'Department is required';
    } else if (department.trim().length < 2) {
      errors.department = 'Department must be at least 2 characters';
    }

    if (!templateId) {
      errors.templateId = 'Please select a template';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setRole('');
    setDepartment('');
    setTemplateId('');
    setFieldErrors({});
    setHasAttemptedSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validateForm() || !user) {
      return;
    }

    try {
      await onSubmit(user, role, department.trim(), templateId);
    } catch {
      // Error handling is done by parent component
    }
  };

  // Guard: don't render if no user
  if (isOpen && !user) {
    return null;
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Assign Role & Onboarding"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel assigning role"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || templatesLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            aria-label="Assign"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign'
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error Messages */}
        {error && <ErrorAlert message={error} />}

        {/* Name (read-only) */}
        <div>
          <label
            htmlFor="assign-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Name
          </label>
          <input
            id="assign-name"
            type="text"
            value={user?.name ?? ''}
            readOnly
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 cursor-not-allowed"
            aria-label="Name"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label
            htmlFor="assign-email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Email
          </label>
          <input
            id="assign-email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 cursor-not-allowed"
            aria-label="Email"
          />
        </div>

        {/* Role Selection */}
        <div>
          <label
            htmlFor="assign-role-select"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Role <span className="text-red-500">*</span>
          </label>
          {rolesLoading ? (
            <div className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
              <LoadingSpinner size="sm" label="Loading roles..." />
            </div>
          ) : (
            <select
              id="assign-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
                hasAttemptedSubmit && fieldErrors.role
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
              }`}
              required
              aria-required="true"
              aria-label="Role"
              aria-describedby={
                hasAttemptedSubmit && fieldErrors.role ? 'assign-role-error' : undefined
              }
              disabled={isSubmitting || rolesLoading}
            >
              <option value="">-- Select a role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          {hasAttemptedSubmit && fieldErrors.role && (
            <p id="assign-role-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.role}
            </p>
          )}
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="assign-department"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Department <span className="text-red-500">*</span>
          </label>
          <input
            id="assign-department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g., Engineering, Sales"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.department
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
            }`}
            required
            aria-required="true"
            aria-label="Department"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.department
                ? 'assign-department-error'
                : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.department && (
            <p
              id="assign-department-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.department}
            </p>
          )}
        </div>

        {/* Template Selection */}
        <div>
          <label
            htmlFor="assign-template-select"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Onboarding Template <span className="text-red-500">*</span>
          </label>
          <select
            id="assign-template-select"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.templateId
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
            }`}
            required
            aria-required="true"
            aria-label="Onboarding template"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.templateId
                ? 'assign-template-error'
                : undefined
            }
            disabled={isSubmitting || templatesLoading}
          >
            <option value="">-- Select a template --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {hasAttemptedSubmit && fieldErrors.templateId && (
            <p
              id="assign-template-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.templateId}
            </p>
          )}
        </div>

        {/* Template Preview */}
        {selectedTemplate && !isSubmitting && (
          <TemplatePreview template={selectedTemplate} />
        )}
      </form>
    </ModalWrapper>
  );
}
