/**
 * useOnboardingInstances Hook - Subscribes to all onboarding instances
 * Manages subscription lifecycle and provides loading/error states
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect, useState } from 'react';
import { subscribeToOnboardingInstances } from '../services/dataClient';
import type { OnboardingInstance } from '../types';

interface UseOnboardingInstancesReturn {
  data: OnboardingInstance[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for subscribing to all onboarding instances
 * Automatically manages subscription and cleanup on unmount
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Object with instances data, loading state, and error state
 */
export function useOnboardingInstances(enabled: boolean = true): UseOnboardingInstancesReturn {
  const [data, setData] = useState<OnboardingInstance[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip subscription if not enabled
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToOnboardingInstances((instances) => {
        setData(instances);
        setIsLoading(false);
      });
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err));
      setError(normalized);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled]);

  return { data, isLoading, error };
}
