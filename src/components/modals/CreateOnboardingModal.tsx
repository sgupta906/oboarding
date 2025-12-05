/**
 * CreateOnboardingModal Component - Form for creating new onboarding instances
 * Allows managers to assign templates to new employees
 * Handles employee data collection, template selection, and validation
 */

import { useState, useMemo } from 'react';
import { ModalWrapper } from '../ui';
import { useTemplates, useRoles } from '../../hooks';

interface CreateOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OnboardingFormData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export interface OnboardingFormData {
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  templateId: string;
  startDate?: number; // Optional Unix timestamp
}

interface FieldErrors {
  [key: string]: string;
}

/**
 * Renders a modal form for creating new onboarding instances
 * Fetches available templates and displays template details as preview
 * Validates all required fields with client-side error feedback
 * @param isOpen - Whether modal is open
 * @param onClose - Callback to close modal
 * @param onSubmit - Callback with onboarding instance data
 * @param isSubmitting - Whether submission is in progress
 * @param error - Server-side error message to display
 */
export function CreateOnboardingModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
}: CreateOnboardingModalProps) {
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { roles, isLoading: rolesLoading } = useRoles();

  // Form state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState('');

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Get selected template for preview
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === templateId);
  }, [templates, templateId]);

  // Validation logic
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    // Employee name validation
    if (!employeeName.trim()) {
      errors.employeeName = 'Employee name is required';
    } else if (employeeName.trim().length < 2) {
      errors.employeeName = 'Employee name must be at least 2 characters';
    }

    // Email validation
    if (!employeeEmail.trim()) {
      errors.employeeEmail = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employeeEmail)) {
        errors.employeeEmail = 'Please enter a valid email address';
      }
    }

    // Role validation
    if (!role.trim()) {
      errors.role = 'Role is required';
    }

    // Department validation
    if (!department.trim()) {
      errors.department = 'Department is required';
    } else if (department.trim().length < 2) {
      errors.department = 'Department must be at least 2 characters';
    }

    // Template validation
    if (!templateId) {
      errors.templateId = 'Please select a template';
    }

    // Check if templates are available
    if (templates.length === 0 && !templatesLoading) {
      errors.templates = 'No templates available. Please create a template first.';
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
    setStartDate('');
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

    if (!validateForm()) {
      return;
    }

    try {
      const formData: OnboardingFormData = {
        employeeName: employeeName.trim(),
        employeeEmail: employeeEmail.trim(),
        role,
        department: department.trim(),
        templateId,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
      };

      await onSubmit(formData);
      resetForm();
    } catch (err) {
      // Error handling is done by parent component
      // Just ensure form doesn't reset on error
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Create New Onboarding"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel creating onboarding"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || templatesLoading || templates.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            aria-label="Create onboarding instance"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create Onboarding'
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Template Unavailable Error */}
        {!templatesLoading && templates.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800">
              No templates available. Please create a template before creating an onboarding instance.
            </p>
          </div>
        )}

        {/* Loading Templates Message */}
        {templatesLoading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">Loading templates...</p>
          </div>
        )}

        {/* Employee Name */}
        <div>
          <label
            htmlFor="employee-name"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Employee Name <span className="text-red-500">*</span>
          </label>
          <input
            id="employee-name"
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="e.g., John Smith"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.employeeName
                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                : 'border-slate-300 focus:ring-indigo-500'
            }`}
            required
            aria-required="true"
            aria-label="Employee name"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.employeeName
                ? 'employee-name-error'
                : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.employeeName && (
            <p
              id="employee-name-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {fieldErrors.employeeName}
            </p>
          )}
        </div>

        {/* Employee Email */}
        <div>
          <label
            htmlFor="employee-email"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="employee-email"
            type="email"
            value={employeeEmail}
            onChange={(e) => setEmployeeEmail(e.target.value)}
            placeholder="e.g., john.smith@company.com"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.employeeEmail
                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                : 'border-slate-300 focus:ring-indigo-500'
            }`}
            required
            aria-required="true"
            aria-label="Employee email"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.employeeEmail
                ? 'employee-email-error'
                : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.employeeEmail && (
            <p
              id="employee-email-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {fieldErrors.employeeEmail}
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role-select" className="block text-sm font-medium text-slate-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          {rolesLoading ? (
            <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500">
              Loading roles...
            </div>
          ) : (
            <select
              id="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors ${
                hasAttemptedSubmit && fieldErrors.role
                  ? 'border-red-300 bg-red-50 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
              required
              aria-required="true"
              aria-label="Employee role"
              aria-describedby={
                hasAttemptedSubmit && fieldErrors.role ? 'role-error' : undefined
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
            <p id="role-error" className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.role}
            </p>
          )}
          {!rolesLoading && roles.length === 0 && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
              No roles available. Please create a role first.
            </p>
          )}
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Department <span className="text-red-500">*</span>
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g., Engineering, Sales"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.department
                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                : 'border-slate-300 focus:ring-indigo-500'
            }`}
            required
            aria-required="true"
            aria-label="Employee department"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.department
                ? 'department-error'
                : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.department && (
            <p
              id="department-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {fieldErrors.department}
            </p>
          )}
        </div>

        {/* Template Selection */}
        <div>
          <label
            htmlFor="template-select"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Onboarding Template <span className="text-red-500">*</span>
          </label>
          <select
            id="template-select"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.templateId
                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                : 'border-slate-300 focus:ring-indigo-500'
            }`}
            required
            aria-required="true"
            aria-label="Onboarding template"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.templateId
                ? 'template-error'
                : undefined
            }
            disabled={isSubmitting || templatesLoading || templates.length === 0}
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
              id="template-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {fieldErrors.templateId}
            </p>
          )}
        </div>

        {/* Template Preview */}
        {selectedTemplate && !isSubmitting && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="font-semibold text-sm text-indigo-900 mb-2">
              Template Preview
            </h4>
            <p className="text-sm text-indigo-800 mb-3">
              <strong>{selectedTemplate.name}</strong>
            </p>
            {selectedTemplate.description && (
              <p className="text-sm text-indigo-700 mb-3">{selectedTemplate.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <span className="font-medium">
                {selectedTemplate.steps.length}
                {selectedTemplate.steps.length === 1 ? ' step' : ' steps'}:
              </span>
              <ul className="list-inside text-sm text-indigo-700 space-y-1">
                {selectedTemplate.steps.slice(0, 5).map((step, idx) => (
                  <li key={idx} className="truncate">
                    {idx + 1}. {step.title}
                  </li>
                ))}
                {selectedTemplate.steps.length > 5 && (
                  <li className="text-indigo-600 italic">
                    ...and {selectedTemplate.steps.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Start Date (Optional) */}
        <div>
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Start Date <span className="text-slate-500">(Optional)</span>
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            aria-label="Employee start date"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-slate-500">
            The date when the employee starts. Leave blank if not yet determined.
          </p>
        </div>
      </form>
    </ModalWrapper>
  );
}
