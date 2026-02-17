/**
 * EmployeeView Component - Main onboarding dashboard for new employees
 * Displays the step timeline and tracks progress through the onboarding journey
 * NavBar (rendered by App.tsx) handles sign-out and view identification.
 */

import { useMemo } from 'react';
import { WelcomeHeader, StepTimeline } from '../components/onboarding';
import type { Step, StepStatus } from '../types';

interface EmployeeViewProps {
  steps: Step[];
  employeeName: string;
  team: string;
  onStatusChange: (id: number, newStatus: StepStatus) => void;
  onSuggestEdit: (stepId: number) => void;
  onReportStuck: (stepId: number) => void;
  loadingStepIds?: Set<number>;
  readOnly?: boolean;
  stepsWithPendingSuggestions?: Set<number>;
}

/**
 * Renders the employee-facing onboarding experience
 * Shows header with status, welcome message, progress bar, and step timeline
 * Optimized to prevent unnecessary re-renders of child components
 *
 * @param steps - Array of onboarding steps
 * @param onStatusChange - Callback for step status updates
 * @param onSuggestEdit - Callback to open suggest edit modal
 * @param onReportStuck - Callback to open report stuck modal
 */
export function EmployeeView({
  steps,
  employeeName,
  team,
  onStatusChange,
  onSuggestEdit,
  onReportStuck,
  loadingStepIds,
  readOnly,
  stepsWithPendingSuggestions,
}: EmployeeViewProps) {
  /**
   * Memoize progress calculation to prevent recalculation on every render
   * Only recalculates when steps array changes
   */
  const progress = useMemo(() => {
    if (steps.length === 0) {
      return 0;
    }
    const completed = steps.filter((s) => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  }, [steps]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-3xl mx-auto w-full space-y-8 px-4 pt-8 pb-12">
          {/* Welcome Header with Progress */}
          <WelcomeHeader
            employeeName={employeeName}
            team={team}
            progress={progress}
          />

          {/* Steps Timeline */}
          <StepTimeline
            steps={steps}
            onStatusChange={onStatusChange}
            onSuggestEdit={onSuggestEdit}
            onReportStuck={onReportStuck}
            loadingStepIds={loadingStepIds}
            readOnly={readOnly}
            stepsWithPendingSuggestions={stepsWithPendingSuggestions}
          />
        </div>
      </main>
    </div>
  );
}
