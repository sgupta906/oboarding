/**
 * ActionBar Component - Step control buttons
 * Handles mark as done, stuck, and suggest edit actions with accessibility
 */

import { CheckCircle, AlertCircle, Edit3, Undo2 } from 'lucide-react';
import type { ActionBarProps } from '../../types';

/**
 * Renders action buttons for a step card
 * Displays different buttons based on step completion status
 * Includes proper hover states, focus states, and accessibility attributes
 * @param step - The step object
 * @param onStatusChange - Callback for status updates
 * @param onSuggestEdit - Callback to open suggest edit modal
 * @param onReportStuck - Callback to open report stuck modal
 */
export function ActionBar({
  step,
  onStatusChange,
  onSuggestEdit,
  onReportStuck,
}: ActionBarProps) {
  const isCompleted = step.status === 'completed';
  const isStuck = step.status === 'stuck';

  return (
    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
      {/* Primary Action */}
      {!isCompleted ? (
        <button
          onClick={() => onStatusChange(step.id, 'completed')}
          disabled={isStuck}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            isStuck
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
              : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2'
          }`}
          aria-label={`Mark ${step.title} as done`}
          title={isStuck ? 'Cannot mark as done while stuck. Clear stuck status first.' : undefined}
        >
          <div className="w-4 h-4 border-2 border-white/30 rounded-full" />
          Mark as Done
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Completed Badge */}
          <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm px-3 py-2 bg-emerald-50 rounded-lg">
            <CheckCircle size={16} /> Completed
          </div>

          {/* Mark as Incomplete Button */}
          <button
            onClick={() => onStatusChange(step.id, 'pending')}
            className="flex items-center gap-2 text-slate-600 font-medium text-sm px-3 py-2 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 active:scale-95 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            aria-label={`Mark ${step.title} as incomplete to resume work`}
            title="Revert completion and resume work on this step"
          >
            <Undo2 size={16} /> Mark as Incomplete
          </button>
        </div>
      )}

      {/* Secondary Actions */}
      {!isCompleted && (
        <>
          {isStuck ? (
            // When stuck: show "Resume Work" button to clear stuck status
            <button
              onClick={() => onStatusChange(step.id, 'pending')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
              aria-label={`Resume work on ${step.title} and clear stuck status`}
              title="Clear stuck status and return to pending"
            >
              <Undo2 size={16} /> Resume Work
            </button>
          ) : (
            // When not stuck: show "I'm Stuck" button to report stuck status
            <button
              onClick={() => onReportStuck(step.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
              aria-label={`Report stuck on ${step.title}`}
              title="Report that you are stuck and need help"
            >
              <AlertCircle size={16} /> I'm Stuck
            </button>
          )}

          <button
            onClick={() => onSuggestEdit(step.id)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-auto focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-95"
            aria-label={`Suggest edit for ${step.title}`}
          >
            <Edit3 size={16} /> Suggest Edit
          </button>
        </>
      )}
    </div>
  );
}
