/**
 * useSuggestions Hook - Subscribes to real-time suggestion updates
 * Manages subscription lifecycle and provides loading/error states
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect, useState } from 'react';
import { subscribeToSuggestions } from '../services/supabase';
import { Suggestion } from '../types';

interface UseSuggestionsReturn {
  data: Suggestion[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for subscribing to all suggestions
 * Automatically manages subscription and cleanup on unmount
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Object with suggestions data, loading state, and error state
 */
export function useSuggestions(enabled: boolean = true): UseSuggestionsReturn {
  const [data, setData] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
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
      unsubscribe = subscribeToSuggestions((suggestions: Suggestion[]) => {
        setData(suggestions);
        setIsLoading(false);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled]);

  return { data, isLoading, error };
}
