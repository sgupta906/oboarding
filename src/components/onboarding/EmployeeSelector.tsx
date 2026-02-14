import { memo } from 'react';
import type { OnboardingInstance } from '../../types';

interface EmployeeSelectorProps {
  instances: OnboardingInstance[];
  selectedId: string | null;
  onSelect: (instanceId: string | null) => void;
  isLoading?: boolean;
}

/**
 * Allows managers to switch between active employee onboarding runs.
 * Extracted from OnboardingHub to keep the container lean and reusable.
 */
function EmployeeSelectorComponent({
  instances,
  selectedId,
  onSelect,
  isLoading,
}: EmployeeSelectorProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <p className="text-sm text-slate-500">Loading employee list...</p>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-700">No active onboarding instances found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <label
        htmlFor="employee-selector"
        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
      >
        Select Employee Onboarding
      </label>
      <select
        id="employee-selector"
        value={selectedId ?? ''}
        onChange={(event) => onSelect(event.target.value || null)}
        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
      >
        <option value="">-- Select an employee --</option>
        {instances.map((instance) => (
          <option key={instance.id} value={instance.id}>
            {instance.employeeName} ({instance.department}) - {instance.progress}% complete
          </option>
        ))}
      </select>
    </div>
  );
}

export const EmployeeSelector = memo(EmployeeSelectorComponent);
