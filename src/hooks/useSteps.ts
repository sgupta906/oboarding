/**
 * useSteps Hook - Subscribes to real-time step updates for an onboarding instance
 * Manages subscription lifecycle and provides loading/error states
 */

import { useEffect, useState, useCallback } from 'react';
import { subscribeToSteps, updateStepStatus } from '../services/supabase';
import type { Step, StepStatus } from '../types';

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
  const [data, setData] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset loading state when instanceId changes
    setIsLoading(true);
    setError(null);

    if (!instanceId) {
      setData([]);
      setIsLoading(false);
      return () => {};
    }

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToSteps(instanceId, (steps: Step[]) => {
        setData(steps);
        setIsLoading(false);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount or instanceId change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [instanceId]);

  /**
   * Optimistically updates a step's status in local state,
   * then sends the update to the server. Rolls back on error.
   */
  const updateStatus = useCallback(async (stepId: number, status: StepStatus): Promise<void> => {
    const snapshot = data;
    setData((prev) => prev.map((s) => (s.id === stepId ? { ...s, status } : s)));
    try {
      await updateStepStatus(instanceId, stepId, status);
    } catch (err) {
      setData(snapshot);
      throw err;
    }
  }, [data, instanceId]);

  return { data, isLoading, error, updateStatus };
}
