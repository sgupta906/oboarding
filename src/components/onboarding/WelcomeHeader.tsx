/**
 * WelcomeHeader Component - Hero section for employee onboarding
 * Displays personalized welcome message, progress bar, and profile selector
 * Includes accessibility features for screen readers
 */

import type { WelcomeHeaderProps } from '../../types';

/**
 * Renders the welcome header with gradient background, progress indicator, and profile selector
 * Includes proper ARIA labels and live region updates
 * @param employeeName - Name of the new employee
 * @param team - Team/department name
 * @param progress - Progress percentage (0-100)
 * @param profiles - Optional array of available profiles
 * @param selectedProfileId - Optional ID of currently selected profile
 * @param onProfileChange - Optional callback when profile selection changes
 */
export function WelcomeHeader({
  employeeName,
  team,
  progress,
  profiles = [],
  selectedProfileId,
  onProfileChange,
}: WelcomeHeaderProps) {
  /**
   * Sanitize progress value to prevent NaN from displaying
   * If progress is NaN (occurs when steps.length === 0), default to 0
   */
  const safeProgress = isNaN(progress) ? 0 : progress;

  const completionMessage =
    safeProgress === 100
      ? 'Onboarding complete!'
      : `${safeProgress}% complete`;

  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-400 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome to the Team, {employeeName}!
          </h1>
          <p className="text-brand-100">Day 1 Onboarding • {team}</p>
        </div>

        {/* Profile Selector Dropdown */}
        {profiles.length > 0 && onProfileChange && (
          <div className="flex flex-col items-end">
            <label
              htmlFor="profile-selector"
              className="text-sm font-medium text-brand-100 mb-2"
            >
              Filter by Role:
            </label>
            <select
              id="profile-selector"
              value={selectedProfileId || 'all'}
              onChange={(e) => {
                if (e.target.value !== 'all') {
                  onProfileChange(e.target.value);
                }
              }}
              className="bg-white/20 text-white border border-white/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              aria-label="Filter steps by profile"
            >
              <option value="all">All Roles</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span id="progress-label">Your Progress</span>
          <span aria-live="polite" aria-atomic="true">
            {safeProgress}%
          </span>
        </div>
        <div
          className="w-full bg-white/20 rounded-full h-2.5"
          role="presentation"
        >
          <div
            className="bg-white h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${safeProgress}%` }}
            role="progressbar"
            aria-labelledby="progress-label"
            aria-valuenow={safeProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={completionMessage}
          />
        </div>
      </div>
    </div>
  );
}
