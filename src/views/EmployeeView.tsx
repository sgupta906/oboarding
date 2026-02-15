/**
 * EmployeeView Component - Main onboarding dashboard for new employees
 * Displays the step timeline and tracks progress through the onboarding journey
 * Features: Top header bar with sign-out button, employee status indicator, optimized component structure
 */

import { LogOut, Shield } from 'lucide-react';
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
}

/**
 * Header component for employee view
 * Displays employee status and sign-out button
 * Matches NavBar styling for consistency
 */
function EmployeeHeader() {
  const handleSignOut = () => {
    window.location.hash = '#/sign-out';
  };

  return (
    <header
      className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Employee Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="bg-brand-100 dark:bg-brand-900 rounded-lg p-2">
            <Shield size={20} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Employee View
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active Onboarding
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 rounded-lg"
          aria-label="Sign out from your account"
          title="Sign out"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
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
      {/* Header with Employee Status and Sign Out */}
      <EmployeeHeader />

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
          />
        </div>
      </main>
    </div>
  );
}
