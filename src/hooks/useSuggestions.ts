/**
 * useSuggestions Hook - Subscribes to real-time suggestion updates
 * Manages subscription lifecycle and provides loading/error states
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect, useState, useCallback } from 'react';
import { subscribeToSuggestions } from '../services/supabase';
import type { Suggestion, SuggestionStatus } from '../types';

interface UseSuggestionsReturn {
  data: Suggestion[];
  isLoading: boolean;
  error: Error | null;
  optimisticUpdateStatus: (id: number | string, status: SuggestionStatus) => Suggestion[];
  optimisticRemove: (id: number | string) => Suggestion[];
  rollback: (snapshot: Suggestion[]) => void;
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

  /**
   * Optimistically updates a suggestion's status in local state.
   * Returns the snapshot for caller to use for rollback on error.
   */
  const optimisticUpdateStatus = useCallback((id: number | string, status: SuggestionStatus): Suggestion[] => {
    const snapshot = data;
    setData((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    return snapshot;
  }, [data]);

  /**
   * Optimistically removes a suggestion from local state.
   * Returns the snapshot for caller to use for rollback on error.
   */
  const optimisticRemove = useCallback((id: number | string): Suggestion[] => {
    const snapshot = data;
    setData((prev) => prev.filter((s) => s.id !== id));
    return snapshot;
  }, [data]);

  /**
   * Restores previous state from a snapshot.
   */
  const rollback = useCallback((snapshot: Suggestion[]) => {
    setData(snapshot);
  }, []);

  return { data, isLoading, error, optimisticUpdateStatus, optimisticRemove, rollback };
}
