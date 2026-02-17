/**
 * TemplateModal Component - Unified create/edit modal for onboarding templates
 * Features: Template name, role tags, status, dynamic steps editor,
 * delete functionality (edit), validation, and full a11y support
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ModalWrapper } from '../ui';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Template, Step, CustomRole } from '../../types';

interface TemplateModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: Omit<Template, 'id' | 'createdAt'>, id?: string) => void;
  onDelete?: (id: string, templateName: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
  roles?: CustomRole[];
  rolesLoading?: boolean;
  template?: Template | null;
  /** Pre-filled steps from PDF import (create mode only) */
  initialSteps?: Array<{ title: string; description: string; link?: string }>;
  /** Source PDF filename for info banner display */
  pdfFileName?: string;
}

interface TemplateStep {
  id?: number;
  _uid: string;
  title: string;
  description: string;
  owner: string;
  expert: string;
  link: string;
}

let stepUidCounter = 0;
function nextStepUid(): string {
  return `step-${++stepUidCounter}`;
}

/**
 * Renders a modal form for creating or editing onboarding templates
 * In create mode: empty form with 1 initial step
 * In edit mode: pre-filled from template prop, includes delete functionality
 */
export function TemplateModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting = false,
  error = null,
  roles = [],
  rolesLoading = false,
  template,
  initialSteps,
  pdfFileName,
}: TemplateModalProps) {
  const isEdit = mode === 'edit';

  const [templateName, setTemplateName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [steps, setSteps] = useState<TemplateStep[]>([
    { _uid: nextStepUid(), title: '', description: '', owner: '', expert: '', link: '' },
  ]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when modal opens in create mode (defense-in-depth for Bug #28)
  // If initialSteps are provided (from PDF import), pre-fill the steps
  useEffect(() => {
    if (isOpen && !isEdit) {
      resetForm();
      if (initialSteps && initialSteps.length > 0) {
        setSteps(
          initialSteps.map((s) => ({
            _uid: nextStepUid(),
            title: s.title,
            description: s.description,
            owner: '',
            expert: '',
            link: s.link || '',
          }))
        );
      }
    }
  }, [isOpen, isEdit, initialSteps]);

  // Pre-fill form when template data changes (edit mode)
  useEffect(() => {
    if (isEdit && template && isOpen) {
      setTemplateName(template.name);
      setSelectedRoles([template.role]);
      setStatus(template.isActive ? 'Published' : 'Draft');
      setSteps(
        template.steps.map((s) => ({
          _uid: nextStepUid(),
          id: s.id,
          title: s.title,
          description: s.description,
          owner: s.owner,
          expert: s.expert,
          link: s.link || '',
        }))
      );
      setValidationErrors([]);
    }
  }, [template, isOpen, isEdit]);

  const resetForm = () => {
    setTemplateName('');
    setSelectedRoles([]);
    setStatus('Draft');
    setSteps(
      isEdit ? [] : [{ _uid: nextStepUid(), title: '', description: '', owner: '', expert: '', link: '' }]
    );
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

    if (isEdit) {
      if (steps.length === 0) {
        errors.push('At least one step is required');
      }

      for (const step of steps) {
        if (!step.title.trim()) {
          errors.push('All steps must have a title');
        }
        if (!step.description.trim()) {
          errors.push('All steps must have a description');
        }
      }
    } else {
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
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddStep = () => {
    setSteps([...steps, { _uid: nextStepUid(), title: '', description: '', owner: '', expert: '', link: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleMoveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };

  const handleMoveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };

  const handleStepChange = (
    index: number,
    field: keyof Omit<TemplateStep, 'id' | '_uid'>,
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

    const stepsToProcess = isEdit
      ? steps
      : steps.filter((s) => s.title.trim() || s.description.trim());

    const templateSteps: Step[] = stepsToProcess.map((s, index) => ({
      id: index + 1,
      title: s.title,
      description: s.description,
      role: selectedRoles[0] || selectedRoles.join(', '),
      owner: s.owner,
      expert: s.expert,
      status: 'pending' as const,
      link: s.link || '',
    }));

    const templateData: Omit<Template, 'id' | 'createdAt'> = {
      name: templateName,
      description: `Template for ${selectedRoles.join(', ')}`,
      role: selectedRoles.join(', '),
      steps: templateSteps,
      isActive: status === 'Published',
      updatedAt: Date.now(),
    };

    if (isEdit && template) {
      await onSubmit(templateData, template.id);
    } else {
      await onSubmit(templateData);
    }
    resetForm();
  };

  const handleDeleteConfirm = async () => {
    if (!template || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(template.id, template.name);
      setDeleteDialogOpen(false);
      resetForm();
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit mode guard
  if (isEdit && !template) return null;

  const title = isEdit ? `Edit Template: ${template!.name}` : 'Create New Template';

  const footer = isEdit ? (
    <div className="flex gap-3 justify-between">
      <button
        type="button"
        onClick={() => setDeleteDialogOpen(true)}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Delete this template"
      >
        Delete Template
      </button>
      <div className="flex gap-3">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Cancel editing template"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          aria-label="Save template changes"
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
    </div>
  ) : (
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
  );

  const modalContent = (
    <ModalWrapper
      isOpen={isOpen}
      title={title}
      onClose={handleClose}
      size="2xl"
      footer={footer}
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

        {/* PDF Import Info Banner */}
        {pdfFileName && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {steps.length} steps imported from {pdfFileName}
            </p>
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
              Onboarding Steps ({steps.length})
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
                key={step._uid}
                className="p-4 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg space-y-3"
              >
                {/* Step Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
                    Step {index + 1} of {steps.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveStepUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Move step ${index + 1} up`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStepDown(index)}
                      disabled={index === steps.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Move step ${index + 1} down`}
                    >
                      <ChevronDown size={16} />
                    </button>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
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
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors resize-y"
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
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
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
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                      aria-label={`Step ${index + 1} expert`}
                    />
                  </div>
                </div>

                {/* Link */}
                {(step.link || mode === 'edit') && (
                  <div>
                    <label
                      htmlFor={`step-link-${index}`}
                      className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Link
                    </label>
                    <input
                      id={`step-link-${index}`}
                      type="url"
                      value={step.link}
                      onChange={(e) =>
                        handleStepChange(index, 'link', e.target.value)
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                      aria-label={`Step ${index + 1} link`}
                    />
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      </form>
    </ModalWrapper>
  );

  // Edit mode wraps with Fragment for DeleteConfirmDialog sibling
  if (isEdit && template) {
    return (
      <>
        {modalContent}
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          templateName={template.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialogOpen(false)}
          isDeleting={isDeleting}
        />
      </>
    );
  }

  return modalContent;
}
