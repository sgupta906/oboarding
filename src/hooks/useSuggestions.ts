/**
 * useSuggestions Hook - Subscribes to suggestions with polling interval
 * Fetches all suggestions and automatically refetches at regular intervals
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect, useState } from 'react';
import { listSuggestions } from '../services/dataClient';
import { Suggestion } from '../types';

interface UseSuggestionsReturn {
  data: Suggestion[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for fetching and polling suggestions
 * Refetches suggestions every 5 seconds to keep data fresh
 * Automatically cleans up polling interval on unmount
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

    // Set initial loading state
    setIsLoading(true);
    setError(null);

    // Track whether component is still mounted
    let isMounted = true;

    // Function to fetch suggestions
    const fetchSuggestions = async () => {
      try {
        const suggestions = await listSuggestions();
        if (isMounted) {
          setData(suggestions);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsLoading(false);
        }
      }
    };

    // Fetch immediately on mount
    fetchSuggestions();

    // Set up polling interval (5 seconds)
    const intervalId = setInterval(fetchSuggestions, 5000);

    // Cleanup interval on unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [enabled]);

  return { data, isLoading, error };
}
