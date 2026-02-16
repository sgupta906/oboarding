/**
 * useActivities Hook - Subscribes to real-time activity updates
 * Thin wrapper over the Zustand store's ActivitiesSlice.
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect } from 'react';
import { useOnboardingStore } from '../store';
import type { Activity } from '../types';

interface UseActivitiesReturn {
  data: Activity[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for subscribing to all activities
 * Automatically manages subscription and cleanup on unmount
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Object with activities data, loading state, and error state
 */
export function useActivities(enabled: boolean = true): UseActivitiesReturn {
  const data = useOnboardingStore((s) => s.activities);
  const isLoading = useOnboardingStore((s) => s.activitiesLoading);
  const error = useOnboardingStore((s) => s.activitiesError);
  const startSubscription = useOnboardingStore(
    (s) => s._startActivitiesSubscription
  );

  useEffect(() => {
    if (!enabled) return;
    const cleanup = startSubscription();
    return cleanup;
  }, [enabled, startSubscription]);

  // When disabled, return defaults (store may still have data from other consumers)
  if (!enabled) {
    return { data: [], isLoading: false, error: null };
  }
  return { data, isLoading, error };
}
