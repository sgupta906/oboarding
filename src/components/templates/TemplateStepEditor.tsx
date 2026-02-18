/**
 * TemplateStepEditor Component - Per-step card editor for TemplateModal
 * Renders inputs for title, description, owner, expert, link with
 * reorder/insert/delete controls
 */

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface TemplateStep {
  id?: number;
  _uid: string;
  title: string;
  description: string;
  owner: string;
  expert: string;
  link: string;
}

interface TemplateStepEditorProps {
  step: TemplateStep;
  index: number;
  totalSteps: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onInsertAfter: (index: number) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: 'title' | 'description' | 'owner' | 'expert' | 'link', value: string) => void;
}

/** Renders a single step editor card with inputs and reorder/delete controls */
export function TemplateStepEditor({
  step,
  index,
  totalSteps,
  onMoveUp,
  onMoveDown,
  onInsertAfter,
  onRemove,
  onChange,
}: TemplateStepEditorProps) {
  return (
    <div
      data-step-uid={step._uid}
      className="p-4 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg space-y-3"
    >
      {/* Step Header Row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
          Step {index + 1} of {totalSteps}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Move step ${index + 1} up`}
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === totalSteps - 1}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Move step ${index + 1} down`}
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={() => onInsertAfter(index)}
            className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            aria-label={`Insert new step after step ${index + 1}`}
            title="Insert step below"
          >
            <Plus size={14} />
          </button>
          {totalSteps > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
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
          onChange={(e) => onChange(index, 'title', e.target.value)}
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
          onChange={(e) => onChange(index, 'description', e.target.value)}
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
            onChange={(e) => onChange(index, 'owner', e.target.value)}
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
            onChange={(e) => onChange(index, 'expert', e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
            aria-label={`Step ${index + 1} expert`}
          />
        </div>
      </div>

      {/* Link */}
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
          onChange={(e) => onChange(index, 'link', e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
          aria-label={`Step ${index + 1} link`}
        />
      </div>
    </div>
  );
}
