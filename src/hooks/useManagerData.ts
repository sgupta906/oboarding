/**
 * useManagerData Hook - Centralizes manager-only Supabase Realtime subscriptions
 * Handles conditional loading for dashboard metrics vs. employee instance lists.
 */

import { useEffect, useState } from 'react';
import { useActivities } from './useActivities';
import { useOnboardingInstances } from './useOnboardingInstances';
import { useSuggestions } from './useSuggestions';
import type { Activity, Suggestion, SuggestionStatus, OnboardingInstance } from '../types';

interface UseManagerDataOptions {
  enableDashboardData: boolean;
  enableInstances: boolean;
  timeoutMs?: number;
}

interface SuggestionsOptimistic {
  optimisticUpdateStatus: (id: number | string, status: SuggestionStatus) => Suggestion[];
  optimisticRemove: (id: number | string) => Suggestion[];
  rollback: (snapshot: Suggestion[]) => void;
}

interface UseManagerDataResult {
  suggestions: Suggestion[];
  activities: Activity[];
  onboardingInstances: OnboardingInstance[];
  isDashboardLoading: boolean;
  areInstancesLoading: boolean;
  suggestionsOptimistic: SuggestionsOptimistic;
}

/**
 * Provides manager-only data streams with timeout fallback so the UI never
 * sticks on a spinner. Dashboard metrics (suggestions/activities) only load
 * when the manager tab is active while onboarding instance lists stay active
 * whenever a manager is signed in (needed for employee timeline switching).
 */
export function useManagerData({
  enableDashboardData,
  enableInstances,
  timeoutMs = 3000,
}: UseManagerDataOptions): UseManagerDataResult {
  const suggestionsResult = useSuggestions(enableDashboardData);
  const activitiesResult = useActivities(enableDashboardData);
  const instancesResult = useOnboardingInstances(enableInstances);

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!enableDashboardData) {
      setTimedOut(false);
      return;
    }

    if (
      !suggestionsResult.isLoading &&
      !activitiesResult.isLoading &&
      (!enableInstances || !instancesResult.isLoading)
    ) {
      setTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timeout);
  }, [
    enableDashboardData,
    enableInstances,
    suggestionsResult.isLoading,
    activitiesResult.isLoading,
    instancesResult.isLoading,
    timeoutMs,
  ]);

  const isDashboardLoading =
    enableDashboardData &&
    !timedOut &&
    (suggestionsResult.isLoading ||
      activitiesResult.isLoading ||
      (enableInstances && instancesResult.isLoading));

  return {
    suggestions: enableDashboardData ? suggestionsResult.data : [],
    activities: enableDashboardData ? activitiesResult.data : [],
    onboardingInstances: enableInstances ? instancesResult.data : [],
    isDashboardLoading,
    areInstancesLoading: enableInstances && instancesResult.isLoading,
    suggestionsOptimistic: {
      optimisticUpdateStatus: suggestionsResult.optimisticUpdateStatus,
      optimisticRemove: suggestionsResult.optimisticRemove,
      rollback: suggestionsResult.rollback,
    },
  };
}
