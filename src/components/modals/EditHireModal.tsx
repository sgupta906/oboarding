/**
 * EditHireModal Component - Form for editing existing onboarding instances
 * Pre-fills with current instance data, supports template reassignment
 * with title-based step merging to preserve completion status
 */

import { useState, useMemo, useEffect } from 'react';
import { ModalWrapper } from '../ui';
import { getTemplate } from '../../services/supabase';
import type { OnboardingInstance, CustomRole, Template, Step } from '../../types';

export interface EditHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instanceId: string, updates: Partial<OnboardingInstance>) => Promise<void>;
  instance: OnboardingInstance | null;
  isSubmitting?: boolean;
  error?: string | null;
  roles?: CustomRole[];
  rolesLoading?: boolean;
  templates?: Template[];
  templatesLoading?: boolean;
}

interface FieldErrors {
  [key: string]: string;
}

/**
 * Renders a modal form for editing an existing onboarding instance.
 * Pre-fills all fields from the instance prop. When a different template
 * is selected, performs title-based step merging to preserve completion
 * status of steps with matching titles.
 */
export function EditHireModal({
  isOpen,
  onClose,
  onSubmit,
  instance,
  isSubmitting = false,
  error = null,
  roles = [],
  rolesLoading = false,
  templates = [],
  templatesLoading = false,
}: EditHireModalProps) {
  // Form state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [templateId, setTemplateId] = useState('');

  // Track original templateId to detect changes
  const [originalTemplateId, setOriginalTemplateId] = useState('');

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Pre-fill form from instance when modal opens or instance changes
  useEffect(() => {
    if (isOpen && instance) {
      setEmployeeName(instance.employeeName);
      setEmployeeEmail(instance.employeeEmail);
      setRole(instance.role);
      setDepartment(instance.department);
      setTemplateId(instance.templateId);
      setOriginalTemplateId(instance.templateId);
      setFieldErrors({});
      setHasAttemptedSubmit(false);
    }
  }, [isOpen, instance]);

  // Detect template change
  const showTemplateWarning = templateId !== '' && originalTemplateId !== '' && templateId !== originalTemplateId;

  // Get selected template for preview
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === templateId);
  }, [templates, templateId]);

  // Validation logic
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!employeeName.trim()) {
      errors.employeeName = 'Employee name is required';
    } else if (employeeName.trim().length < 2) {
      errors.employeeName = 'Employee name must be at least 2 characters';
    }

    if (!employeeEmail.trim()) {
      errors.employeeEmail = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employeeEmail)) {
        errors.employeeEmail = 'Please enter a valid email address';
      }
    }

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
    setEmployeeName('');
    setEmployeeEmail('');
    setRole('');
    setDepartment('');
    setTemplateId('');
    setOriginalTemplateId('');
    setFieldErrors({});
    setHasAttemptedSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Title-based step merging: preserves completion status for steps
   * whose titles match between old instance steps and new template steps.
   */
  const mergeSteps = (existingSteps: Step[], newTemplateSteps: Step[]): Step[] => {
    // Build a map of existing step title -> status
    const statusByTitle = new Map<string, Step['status']>();
    for (const step of existingSteps) {
      statusByTitle.set(step.title, step.status);
    }

    return newTemplateSteps.map((templateStep, idx) => {
      const existingStatus = statusByTitle.get(templateStep.title);
      return {
        ...templateStep,
        id: idx + 1,
        status: existingStatus ?? 'pending',
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validateForm() || !instance) {
      return;
    }

    try {
      const updates: Partial<OnboardingInstance> = {};

      // Only include changed fields
      const trimmedName = employeeName.trim();
      const trimmedEmail = employeeEmail.trim();
      const trimmedDept = department.trim();

      if (trimmedName !== instance.employeeName) updates.employeeName = trimmedName;
      if (trimmedEmail !== instance.employeeEmail) updates.employeeEmail = trimmedEmail;
      if (role !== instance.role) updates.role = role;
      if (trimmedDept !== instance.department) updates.department = trimmedDept;

      // Handle template change with step merging
      if (templateId !== originalTemplateId) {
        updates.templateId = templateId;

        // Fetch the full new template to get its steps
        const newTemplate = await getTemplate(templateId);
        if (newTemplate && newTemplate.steps) {
          const mergedSteps = mergeSteps(instance.steps, newTemplate.steps);
          updates.steps = mergedSteps;

          // Recalculate progress
          const completedCount = mergedSteps.filter((s) => s.status === 'completed').length;
          updates.progress = mergedSteps.length > 0
            ? Math.round((completedCount / mergedSteps.length) * 100)
            : 0;
        }
      }

      await onSubmit(instance.id, updates);
    } catch {
      // Error handling is done by parent component
      // Form stays open on error (Bug #8 pattern)
    }
  };

  // Guard: don't render if no instance
  if (isOpen && !instance) {
    return null;
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Edit Onboarding"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel editing onboarding"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || templatesLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            aria-label="Save changes"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error Messages */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm font-medium text-red-800 dark:text-red-300" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Template Change Warning */}
        {showTemplateWarning && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Changing the template will reset step progress. Steps with matching titles will keep their completion status.
            </p>
          </div>
        )}

        {/* Employee Name */}
        <div>
          <label
            htmlFor="edit-employee-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Employee Name <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-employee-name"
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="e.g., John Smith"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.employeeName
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
            }`}
            required
            aria-required="true"
            aria-label="Employee name"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.employeeName
                ? 'edit-employee-name-error'
                : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.employeeName && (
            <p
              id="edit-employee-name-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.employeeName}
            </p>
          )}
        </div>

        {/* Employee Email */}
        <div>
          <label
            htmlFor="edit-employee-email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-employee-email"
            type="email"
            value={employeeEmail}
            onChange={(e) => setEmployeeEmail(e.target.value)}
            placeholder="e.g., john.smith@company.com"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.employeeEmail
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
            }`}
            required
            aria-required="true"
            aria-label="Employee email"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.employeeEmail
                ? 'edit-employee-email-error'
                : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.employeeEmail && (
            <p
              id="edit-employee-email-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.employeeEmail}
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label
            htmlFor="edit-role-select"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Role <span className="text-red-500">*</span>
          </label>
          {rolesLoading ? (
            <div className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              Loading roles...
            </div>
          ) : (
            <select
              id="edit-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
                hasAttemptedSubmit && fieldErrors.role
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
              }`}
              required
              aria-required="true"
              aria-label="Employee role"
              aria-describedby={
                hasAttemptedSubmit && fieldErrors.role ? 'edit-role-error' : undefined
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
            <p id="edit-role-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.role}
            </p>
          )}
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="edit-department"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Department <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-department"
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
            aria-label="Employee department"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.department
                ? 'edit-department-error'
                : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.department && (
            <p
              id="edit-department-error"
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
            htmlFor="edit-template-select"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Role-Based Template <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            Changing the template will merge steps using title-based matching
          </p>
          <select
            id="edit-template-select"
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
                ? 'edit-template-error'
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
              id="edit-template-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.templateId}
            </p>
          )}
        </div>

        {/* Template Preview */}
        {selectedTemplate && !isSubmitting && (
          <div className="p-4 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700 rounded-lg">
            <h4 className="font-semibold text-sm text-brand-900 dark:text-brand-300 mb-2">
              Template Preview
            </h4>
            <p className="text-sm text-brand-800 dark:text-brand-300 mb-3">
              <strong>{selectedTemplate.name}</strong>
            </p>
            {selectedTemplate.description && (
              <p className="text-sm text-brand-700 dark:text-brand-400 mb-3">
                {selectedTemplate.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-400">
              <span className="font-medium">
                {selectedTemplate.steps.length}
                {selectedTemplate.steps.length === 1 ? ' step' : ' steps'}:
              </span>
              <ul className="list-inside text-sm text-brand-700 dark:text-brand-400 space-y-1">
                {selectedTemplate.steps.slice(0, 5).map((step, idx) => (
                  <li key={idx} className="truncate">
                    {idx + 1}. {step.title}
                  </li>
                ))}
                {selectedTemplate.steps.length > 5 && (
                  <li className="text-brand-600 dark:text-brand-500 italic">
                    ...and {selectedTemplate.steps.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </form>
    </ModalWrapper>
  );
}
