/**
 * useSteps Hook - Subscribes to real-time step updates for an onboarding instance
 * Manages subscription lifecycle and provides loading/error states
 *
 * Reads from the Zustand store's StepsSlice. The store handles ref-counted
 * subscriptions and optimistic updates, eliminating stale-closure bugs.
 */

import { useEffect, useCallback } from 'react';
import { useOnboardingStore } from '../store';
import type { Step, StepStatus } from '../types';

/** Stable empty array to prevent new reference on every render */
const EMPTY_STEPS: Step[] = [];

interface UseStepsReturn {
  data: Step[];
  isLoading: boolean;
  error: Error | null;
  updateStatus: (stepId: number, status: StepStatus) => Promise<void>;
}

/**
 * Custom hook for subscribing to steps in an onboarding instance
 * Automatically manages subscription and cleanup on unmount
 * @param instanceId - The onboarding instance ID to subscribe to
 * @returns Object with steps data, loading state, and error state
 */
export function useSteps(instanceId: string): UseStepsReturn {
  const data = useOnboardingStore(
    (s) => s.stepsByInstance[instanceId] ?? EMPTY_STEPS
  );
  const isLoading = useOnboardingStore(
    (s) => s.stepsLoadingByInstance[instanceId] ?? false
  );
  const error = useOnboardingStore(
    (s) => s.stepsErrorByInstance[instanceId] ?? null
  );

  useEffect(() => {
    if (!instanceId) return;
    const cleanup =
      useOnboardingStore.getState()._startStepsSubscription(instanceId);
    return cleanup;
  }, [instanceId]);

  /**
   * Optimistically updates a step's status via the store action.
   * Dependency is [instanceId] only -- no stale closure over data.
   */
  const updateStatus = useCallback(
    (stepId: number, status: StepStatus) =>
      useOnboardingStore
        .getState()
        ._updateStepStatus(instanceId, stepId, status),
    [instanceId]
  );

  return {
    data: instanceId ? data : EMPTY_STEPS,
    isLoading: instanceId ? isLoading : false,
    error: instanceId ? error : null,
    updateStatus,
  };
}
