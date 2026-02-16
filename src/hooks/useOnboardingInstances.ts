/**
 * useOnboardingInstances Hook - Subscribes to all onboarding instances
 * Reads from the shared Zustand store, ensuring all consumers share
 * a single Supabase Realtime subscription via ref-counting.
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect } from 'react';
import { useOnboardingStore } from '../store';
import type { OnboardingInstance } from '../types';

/** Return type for the useOnboardingInstances hook */
interface UseOnboardingInstancesReturn {
  data: OnboardingInstance[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for subscribing to all onboarding instances.
 * Reads from the shared Zustand store -- multiple consumers share
 * a single underlying Supabase Realtime subscription.
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Object with instances data, loading state, and error state
 */
export function useOnboardingInstances(enabled: boolean = true): UseOnboardingInstancesReturn {
  const instances = useOnboardingStore((s) => s.instances);
  const isLoading = useOnboardingStore((s) => s.instancesLoading);
  const error = useOnboardingStore((s) => s.instancesError);

  useEffect(() => {
    if (!enabled) return;
    const unsub = useOnboardingStore.getState()._startInstancesSubscription();
    return unsub;
  }, [enabled]);

  return {
    data: enabled ? instances : [],
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
  };
}
