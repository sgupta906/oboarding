/**
 * ManagerDashboardHeader Component - Header section with title and new hire button
 * Extracted from ManagerView for better composition
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
      <h1 className="text-2xl font-bold text-slate-900">
        Onboarding Dashboard
      </h1>
      <button
        onClick={onNewHireClick}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        aria-label="Add a new hire to the system"
      >
        + New Hire
      </button>
    </div>
  );
}
