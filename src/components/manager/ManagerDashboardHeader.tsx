/**
 * ManagerDashboardHeader Component - Header section with title and new hire button
 * Extracted from ManagerView for better composition
 *
 * The "New Hire" button creates an OnboardingInstance + User record for employees
 * who need to complete onboarding steps. Use this for new employees, interns, or
 * contractors joining the company.
 *
 * For adding managers, admins, or non-employee users, use the "New User" button
 * in the Users tab instead.
 */

import type { ManagerDashboardHeaderProps } from '../../types';

/**
 * Renders the manager dashboard header with title and action button
 * @param onNewHireClick - Optional callback for "New Hire" button
 */
export function ManagerDashboardHeader({
  onNewHireClick,
}: ManagerDashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Onboarding Dashboard
      </h1>
      <button
        onClick={onNewHireClick}
        className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        aria-label="Add a new employee onboarding. Use this for employees, interns, or contractors who need to complete onboarding steps."
        title="Add a new employee onboarding. Creates guided onboarding steps for the new hire."
      >
        + New Hire
      </button>
    </div>
  );
}
