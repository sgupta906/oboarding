/**
 * useTemplates Hook - Subscribes to real-time template updates
 * Manages subscription lifecycle and provides loading/error states
 * Similar to useSteps pattern but for onboarding templates
 *
 * Performance: Includes timeout fallback to prevent infinite loading
 */

import { useEffect, useState, useCallback } from 'react';
import { subscribeToTemplates } from '../services/supabase';
import type { Template } from '../types';

interface UseTemplatesReturn {
  data: Template[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for subscribing to templates with real-time updates
 * Automatically manages subscription and cleanup on unmount
 * Includes 3-second timeout fallback to prevent infinite loading
 * @returns Object with templates data, loading state, error state, and refetch function
 */
export function useTemplates(): UseTemplatesReturn {
  const [data, setData] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCount, setRefetchCount] = useState<number>(0);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  const refetch = useCallback(() => {
    setTimedOut(false);
    setRefetchCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Reset loading state when refetch is triggered
    setIsLoading(true);
    setError(null);
    setTimedOut(false);

    let unsubscribe: (() => void) | null = null;
    let hasReceivedData = false;

    // Timeout fallback to prevent infinite loading (3 seconds)
    const timeoutId = setTimeout(() => {
      if (!hasReceivedData) {
        console.warn('Templates subscription timed out - using empty fallback');
        setTimedOut(true);
        setIsLoading(false);
      }
    }, 3000);

    try {
      unsubscribe = subscribeToTemplates((templates: Template[]) => {
        hasReceivedData = true;
        clearTimeout(timeoutId);
        setData(templates);
        setIsLoading(false);
        setTimedOut(false);
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount or refetch
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refetchCount]);

  // If timed out, treat as loaded with empty data (not an error)
  const effectiveLoading = !timedOut && isLoading;

  return { data, isLoading: effectiveLoading, error, refetch };
}
