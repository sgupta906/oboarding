/**
 * useEmployeeOnboarding Hook - Derives employee onboarding instance from the store
 * Reads from the shared Zustand store, filtering by employee email.
 * Eliminates the need for a separate per-email Supabase subscription.
 */

import { useEffect } from 'react';
import { useOnboardingStore } from '../store';
import type { OnboardingInstance } from '../types';

/** Return type for the useEmployeeOnboarding hook */
interface UseEmployeeOnboardingReturn {
  instance: OnboardingInstance | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for getting a specific employee's onboarding instance.
 * Derives the result from the shared Zustand store's instances array
 * using case-insensitive email matching, returning the most recent instance.
 * @param email - Employee email to look up, or null if no employee selected
 * @returns Object with the employee's instance, loading state, and error state
 */
export function useEmployeeOnboarding(email: string | null): UseEmployeeOnboardingReturn {
  const instance = useOnboardingStore((s) =>
    email
      ? s.instances
          .filter((i) => i.employeeEmail.toLowerCase() === email.toLowerCase())
          .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
      : null
  );
  const isLoading = useOnboardingStore((s) => s.instancesLoading);
  const error = useOnboardingStore((s) => s.instancesError);

  useEffect(() => {
    if (!email) return;
    const unsub = useOnboardingStore.getState()._startInstancesSubscription();
    return unsub;
  }, [email]);

  return {
    instance,
    isLoading: !!email && isLoading,
    error: email ? error : null,
  };
}
