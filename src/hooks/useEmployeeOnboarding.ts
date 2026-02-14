import { useEffect, useState } from 'react';
import { subscribeToEmployeeInstance } from '../services/supabase';
import type { OnboardingInstance } from '../types';

interface UseEmployeeOnboardingReturn {
  instance: OnboardingInstance | null;
  isLoading: boolean;
  error: Error | null;
}

export function useEmployeeOnboarding(email: string | null): UseEmployeeOnboardingReturn {
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!email);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!email) {
      setInstance(null);
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    setIsLoading(true);
    setError(null);
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToEmployeeInstance(email, (result) => {
        setInstance(result);
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
  }, [email]);

  return { instance, isLoading, error };
}
