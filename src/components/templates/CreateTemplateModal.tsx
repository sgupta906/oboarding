/**
 * CreateTemplateModal Component - Form for creating new onboarding templates
 * Handles template name, role tags, status, and steps configuration
 */

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ModalWrapper } from '../ui';
import type { Template, Step, CustomRole } from '../../types';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  isSubmitting?: boolean;
  error?: string | null;
  roles?: CustomRole[];
  rolesLoading?: boolean;
}

interface TemplateStep {
  title: string;
  description: string;
  owner: string;
  expert: string;
}

/**
 * Renders a modal form for creating new templates
 * Validates required fields and step configuration
 * @param isOpen - Whether modal is open
 * @param onClose - Callback to close modal
 * @param onSubmit - Callback with template data
 * @param isSubmitting - Whether submission is in progress
 * @param error - Error message to display
 */
export function CreateTemplateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
  roles = [],
  rolesLoading = false,
}: CreateTemplateModalProps) {

  const [templateName, setTemplateName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [steps, setSteps] = useState<TemplateStep[]>([
    { title: '', description: '', owner: '', expert: '' },
  ]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const resetForm = () => {
    setTemplateName('');
    setSelectedRoles([]);
    setStatus('Draft');
    setSteps([{ title: '', description: '', owner: '', expert: '' }]);
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!templateName.trim()) {
      errors.push('Template name is required');
    }

    if (selectedRoles.length === 0) {
      errors.push('At least one role must be selected');
    }

    const validSteps = steps.filter((s) => s.title.trim() || s.description.trim());
    if (validSteps.length === 0) {
      errors.push('At least one step with title and description is required');
    }

    for (const step of validSteps) {
      if (!step.title.trim()) {
        errors.push('All steps must have a title');
      }
      if (!step.description.trim()) {
        errors.push('All steps must have a description');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddStep = () => {
    setSteps([...steps, { title: '', description: '', owner: '', expert: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (
    index: number,
    field: keyof TemplateStep,
    value: string
  ) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const validSteps = steps.filter((s) => s.title.trim() || s.description.trim());
    const templateSteps: Step[] = validSteps.map((s, index) => ({
      id: index + 1,
      title: s.title,
      description: s.description,
      role: selectedRoles.join(', '),
      owner: s.owner,
      expert: s.expert,
      status: 'pending' as const,
      link: '',
    }));

    const template: Omit<Template, 'id' | 'createdAt'> = {
      name: templateName,
      description: `Template for ${selectedRoles.join(', ')}`,
      role: selectedRoles.join(', '),
      steps: templateSteps,
      isActive: status === 'Published',
      updatedAt: Date.now(),
    };

    await onSubmit(template);
    resetForm();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Create New Template"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel creating template"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            aria-label="Save template"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Template'
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Messages */}
        {(error || validationErrors.length > 0) && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
              {error || 'Please fix the following errors:'}
            </p>
            {validationErrors.length > 0 && (
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 ml-4">
                {validationErrors.map((err, index) => (
                  <li key={index} className="list-disc">
                    {err}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Template Name */}
        <div>
          <label
            htmlFor="template-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Template Name
          </label>
          <input
            id="template-name"
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Engineering Onboarding"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
            required
            aria-required="true"
            aria-label="Template name"
          />
        </div>

        {/* Role Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Applicable Roles
          </label>
          {rolesLoading ? (
            <div className="text-slate-500 dark:text-slate-400 text-sm">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-300">
              No roles available. Please create a role first.
            </div>
          ) : (
            <fieldset className="space-y-2">
              <legend className="sr-only">Select applicable roles</legend>
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => handleRoleToggle(role.name)}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    aria-label={`Include ${role.name} role`}
                    disabled={rolesLoading}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{role.name}</span>
                </label>
              ))}
            </fieldset>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Status
          </label>
          <fieldset className="flex gap-4">
            <legend className="sr-only">Select template status</legend>
            {(['Draft', 'Published'] as const).map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="w-4 h-4 text-brand-600 focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  aria-label={`Set status to ${s}`}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{s}</span>
              </label>
            ))}
          </fieldset>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Onboarding Steps
            </label>
            <button
              type="button"
              onClick={handleAddStep}
              className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              aria-label="Add new step"
            >
              <Plus size={16} />
              Add Step
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg space-y-3 relative"
              >
                {/* Step Number */}
                <div className="absolute top-2 right-2 text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
                  Step {index + 1}
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor={`step-title-${index}`}
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id={`step-title-${index}`}
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                    placeholder="Step title"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                    aria-label={`Step ${index + 1} title`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor={`step-desc-${index}`}
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id={`step-desc-${index}`}
                    value={step.description}
                    onChange={(e) =>
                      handleStepChange(index, 'description', e.target.value)
                    }
                    placeholder="Step description"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors resize-none"
                    aria-label={`Step ${index + 1} description`}
                  />
                </div>

                {/* Owner and Expert */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={`step-owner-${index}`}
                      className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Owner
                    </label>
                    <input
                      id={`step-owner-${index}`}
                      type="text"
                      value={step.owner}
                      onChange={(e) =>
                        handleStepChange(index, 'owner', e.target.value)
                      }
                      placeholder="e.g., IT Support"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                      aria-label={`Step ${index + 1} owner`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`step-expert-${index}`}
                      className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Expert
                    </label>
                    <input
                      id={`step-expert-${index}`}
                      type="text"
                      value={step.expert}
                      onChange={(e) =>
                        handleStepChange(index, 'expert', e.target.value)
                      }
                      placeholder="e.g., John Doe"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-600 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                      aria-label={`Step ${index + 1} expert`}
                    />
                  </div>
                </div>

                {/* Remove Button */}
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="absolute top-2 right-10 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
}
