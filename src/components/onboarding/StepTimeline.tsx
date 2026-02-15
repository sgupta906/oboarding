/**
 * StepTimeline Component - Container for onboarding step cards
 * Renders vertical timeline with connecting line and all step cards
 * Includes progress tracking and visual hierarchy
 */

import { StepCard } from './StepCard';
import type { Step, StepStatus } from '../../types';

interface StepTimelineProps {
  steps: Step[];
  onStatusChange: (id: number, newStatus: StepStatus) => void;
  onSuggestEdit: (stepId: number) => void;
  onReportStuck: (stepId: number) => void;
  loadingStepIds?: Set<number>;
}

/**
 * Renders a vertical timeline of onboarding steps
 * Features:
 * - Vertical connecting line on desktop (hidden on mobile)
 * - Visual progress tracking with color gradients
 * - Step position indicators (first, middle, last)
 * - Smooth scrolling support for long timelines
 *
 * @param steps - Array of step objects
 * @param onStatusChange - Callback for status updates
 * @param onSuggestEdit - Callback to open suggest edit modal
 * @param onReportStuck - Callback to open report stuck modal
 */
export function StepTimeline({
  steps,
  onStatusChange,
  onSuggestEdit,
  onReportStuck,
  loadingStepIds,
}: StepTimelineProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const stuckCount = steps.filter((s) => s.status === 'stuck').length;

  /**
   * Determines if onboarding is fully complete
   * Must have: steps.length > 0 AND all steps with status === 'completed'
   * Handles edge case of 0 steps (returns false)
   */
  const isOnboardingComplete =
    steps.length > 0 && steps.every((s) => s.status === 'completed');

  return (
    <div
      className="space-y-6 relative"
      role="list"
      aria-label="Onboarding steps timeline"
    >
      {/* Vertical Line - Desktop only */}
      <div
        className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 -z-10 hidden md:block"
        aria-hidden="true"
      />

      {/* Timeline summary for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {completedCount} of {steps.length} steps completed
        {stuckCount > 0 && `, ${stuckCount} step(s) marked as stuck`}
      </div>

      {/* Step Cards */}
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isStepCompleted = step.status === 'completed';

        return (
          <div key={step.id} role="listitem">
            <StepCard
              step={step}
              index={index}
              onStatusChange={onStatusChange}
              onSuggestEdit={onSuggestEdit}
              onReportStuck={onReportStuck}
              isLoading={loadingStepIds?.has(step.id)}
            />

            {/* Visual connectors between steps */}
            {!isLast && (
              <div
                className="hidden md:block h-2 relative"
                aria-hidden="true"
              >
                {/* Gradient connector line based on completion */}
                <div
                  className={`absolute left-8 top-0 w-0.5 h-full ${
                    isStepCompleted
                      ? 'bg-emerald-300'
                      : 'bg-slate-200'
                  } transition-colors duration-500`}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Completion Footer - Only show when ALL steps completed (and steps.length > 0) */}
      {isOnboardingComplete && (
        <div
          className="hidden md:flex justify-center pt-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-700 font-semibold">
              Onboarding Complete
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
