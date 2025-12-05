/**
 * SuggestionsSection Component - Documentation feedback display
 * Container for showing submitted suggestions/feedback on onboarding docs
 * Features: Real-time filtering, empty states, and dynamic suggestion count
 */

import { Edit3, CheckCircle } from 'lucide-react';
import { SuggestionCard } from './SuggestionCard';
import { Card } from '../ui';
import type { SuggestionsSectionProps } from '../../types';

/**
 * Renders the documentation feedback section with list of suggestions
 * Only displays pending suggestions; approved/rejected are hidden
 * @param suggestions - Array of submitted suggestions
 * @param steps - Array of steps for title lookup
 * @param onApprove - Callback when approving a suggestion
 * @param onReject - Callback when rejecting a suggestion
 */
export function SuggestionsSection({
  suggestions,
  steps,
  onApprove,
  onReject,
}: SuggestionsSectionProps) {
  /**
   * Find the step title by ID
   */
  const getStepTitle = (stepId: number): string => {
    return steps.find((s) => s.id === stepId)?.title || 'Unknown Step';
  };

  // Filter only pending suggestions
  const pendingSuggestions = suggestions.filter(
    (s) => s.status === 'pending'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Edit3 size={18} className="text-indigo-600" />
          Documentation Feedback
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            {pendingSuggestions.length}
          </span>
        </h2>
      </div>

      {pendingSuggestions.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-emerald-100">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">
            All caught up!
          </p>
          <p className="text-slate-400 text-sm mt-1">
            No pending suggestions at this time.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingSuggestions.map((sugg) => (
            <SuggestionCard
              key={sugg.id}
              suggestion={sugg}
              stepTitle={getStepTitle(sugg.stepId)}
              onApprove={onApprove || (() => {})}
              onReject={onReject || (() => {})}
            />
          ))}
        </div>
      )}
    </div>
  );
}
