/**
 * Utility functions for filtering steps based on profile role tags
 */

import type { Step, Profile } from '../types';

/**
 * Filters steps to only include those with role tags that match the selected profile
 * Security: Validates that both step.role and profile.roleTags are non-empty
 *
 * A step is included if:
 * 1. No profile is selected (all steps shown)
 * 2. Profile has no roleTags (all steps shown)
 * 3. Step's role matches any of the profile's roleTags
 *
 * @param steps - Array of steps to filter
 * @param selectedProfile - The currently selected profile, or null/undefined for no filter
 * @returns Array of filtered steps
 */
export function filterStepsByProfile(
  steps: Step[],
  selectedProfile: Profile | null | undefined
): Step[] {
  // If no profile selected or profile has no roleTags, return all steps
  if (!selectedProfile || !selectedProfile.roleTags || selectedProfile.roleTags.length === 0) {
    return steps;
  }

  // Filter steps to include only those whose role matches any of the profile's roleTags
  return steps.filter((step) => {
    // Include step if its role matches any of the profile's roleTags
    return selectedProfile.roleTags.includes(step.role);
  });
}

/**
 * Filters steps by profile and returns only those with a specific status
 * Combines profile filtering with status filtering
 *
 * @param steps - Array of steps to filter
 * @param selectedProfile - The currently selected profile
 * @param status - The status to filter by (pending, completed, stuck)
 * @returns Array of filtered steps matching both profile and status
 */
export function filterStepsByProfileAndStatus(
  steps: Step[],
  selectedProfile: Profile | null | undefined,
  status: 'pending' | 'completed' | 'stuck'
): Step[] {
  const profileFiltered = filterStepsByProfile(steps, selectedProfile);
  return profileFiltered.filter((step) => step.status === status);
}

/**
 * Calculates the count of steps matching a profile and status combination
 * Useful for KPI calculations with profile filters
 *
 * @param steps - Array of steps to analyze
 * @param selectedProfile - The currently selected profile
 * @param status - The status to count
 * @returns Number of steps matching the criteria
 */
export function countStepsByProfileAndStatus(
  steps: Step[],
  selectedProfile: Profile | null | undefined,
  status: 'pending' | 'completed' | 'stuck'
): number {
  return filterStepsByProfileAndStatus(steps, selectedProfile, status).length;
}
