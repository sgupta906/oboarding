/**
 * KPISection Component - Grid display of KPI cards with profile filtering
 * Container component for key performance indicators
 * Features: Real-time KPI calculations, tooltips, dynamic status updates, and profile-based filtering
 */

import { User, ShieldAlert, MessageSquare } from 'lucide-react';
import { KPICard } from './KPICard';
import { countStepsByProfileAndStatus } from '../../utils/filterUtils';
import type { KPISectionProps } from '../../types';

/**
 * Renders the KPI cards grid showing key metrics
 * Calculates KPIs in real-time based on steps and suggestions data
 * Supports filtering by profile to segment data by role
 * @param steps - Array of onboarding steps (for stuck count and active count)
 * @param suggestions - Array of suggestions (for feedback count)
 * @param stuckEmployeeNames - Names of employees who are stuck
 * @param profiles - Optional array of available profiles for filtering
 * @param selectedProfileId - Optional ID of currently selected profile
 * @param onProfileChange - Optional callback when profile selection changes
 */
export function KPISection({
  steps,
  suggestions,
  stuckEmployeeNames = [],
  profiles = [],
  selectedProfileId,
  onProfileChange,
}: KPISectionProps) {
  // Get the selected profile object for filtering
  const selectedProfile = selectedProfileId
    ? profiles.find((p) => p.id === selectedProfileId)
    : null;

  // Calculate active onboardings (steps that are pending) - respects profile filter
  const getActiveCount = (): number => {
    return countStepsByProfileAndStatus(steps, selectedProfile, 'pending');
  };

  // Calculate stuck count - respects profile filter
  const getStuckCount = (): number => {
    return countStepsByProfileAndStatus(steps, selectedProfile, 'stuck');
  };

  // Get pending suggestions count
  const getPendingSuggestionsCount = (): number => {
    return suggestions.filter((s) => s.status === 'pending').length;
  };

  const activeCount = getActiveCount();
  const stuckCount = getStuckCount();
  const pendingCount = getPendingSuggestionsCount();

  return (
    <div className="space-y-6">
      {/* Profile Filter Dropdown */}
      {profiles.length > 0 && onProfileChange && (
        <div className="flex items-center gap-3">
          <label htmlFor="kpi-profile-selector" className="font-medium text-gray-700">
            Filter by Profile:
          </label>
          <select
            id="kpi-profile-selector"
            value={selectedProfileId || 'all'}
            onChange={(e) => {
              if (e.target.value !== 'all') {
                onProfileChange(e.target.value);
              }
            }}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter KPIs by profile"
          >
            <option value="all">All Profiles</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-3 gap-6 auto-rows-fr">
      <KPICard
        label="Active Onboardings"
        value={activeCount}
        tooltip="Employees currently completing their onboarding"
        icon={<User size={24} />}
        color="success"
      />

      <KPICard
        label="Stuck Employees"
        value={stuckCount}
        subtext={
          stuckCount > 0
            ? `Needs attention: ${stuckEmployeeNames.join(', ')}.`
            : 'All on track'
        }
        tooltip="Employees who reported being stuck on a step"
        icon={<ShieldAlert size={24} />}
        color="error"
      />

      <KPICard
        label="Doc Feedback"
        value={pendingCount}
        subtext={pendingCount > 0 ? 'Pending review' : 'All reviewed'}
        tooltip="Suggestions and feedback awaiting manager review"
        icon={<MessageSquare size={24} />}
        color="warning"
      />
      </div>
    </div>
  );
}
