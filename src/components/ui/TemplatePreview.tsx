/**
 * TemplatePreview Component - Displays a preview of template steps
 * Used in modals that allow template selection (CreateOnboarding, EditHire, AssignRole)
 */

import type { Template } from '../../types';

interface TemplatePreviewProps {
  template: Template;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="p-4 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700 rounded-lg">
      <h4 className="font-semibold text-sm text-brand-900 dark:text-brand-300 mb-2">
        Template Preview
      </h4>
      <p className="text-sm text-brand-800 dark:text-brand-300 mb-3">
        <strong>{template.name}</strong>
      </p>
      {template.description && (
        <p className="text-sm text-brand-700 dark:text-brand-400 mb-3">
          {template.description}
        </p>
      )}
      <div className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-400">
        <span className="font-medium">
          {template.steps.length}
          {template.steps.length === 1 ? ' step' : ' steps'}:
        </span>
        <ul className="list-inside text-sm text-brand-700 dark:text-brand-400 space-y-1">
          {template.steps.slice(0, 5).map((step, idx) => (
            <li key={idx} className="truncate">
              {idx + 1}. {step.title}
            </li>
          ))}
          {template.steps.length > 5 && (
            <li className="text-brand-600 dark:text-brand-500 italic">
              ...and {template.steps.length - 5} more
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
