/**
 * useSuggestions Hook - Subscribes to real-time suggestion updates
 * Thin wrapper over the Zustand store's SuggestionsSlice.
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect, useCallback } from 'react';
import { useOnboardingStore } from '../store';
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
  const data = useOnboardingStore((s) => s.suggestions);
  const isLoading = useOnboardingStore((s) => s.suggestionsLoading);
  const error = useOnboardingStore((s) => s.suggestionsError);
  const startSubscription = useOnboardingStore(
    (s) => s._startSuggestionsSubscription
  );
  const storeOptimisticUpdate = useOnboardingStore(
    (s) => s._optimisticUpdateSuggestionStatus
  );
  const storeOptimisticRemove = useOnboardingStore(
    (s) => s._optimisticRemoveSuggestion
  );
  const storeRollback = useOnboardingStore((s) => s._rollbackSuggestions);

  useEffect(() => {
    if (!enabled) return;
    const cleanup = startSubscription();
    return cleanup;
  }, [enabled, startSubscription]);

  /**
   * Optimistically updates a suggestion's status in local state.
   * Returns the snapshot for caller to use for rollback on error.
   */
  const optimisticUpdateStatus = useCallback(
    (id: number | string, status: SuggestionStatus) =>
      storeOptimisticUpdate(id, status),
    [storeOptimisticUpdate]
  );

  /**
   * Optimistically removes a suggestion from local state.
   * Returns the snapshot for caller to use for rollback on error.
   */
  const optimisticRemove = useCallback(
    (id: number | string) => storeOptimisticRemove(id),
    [storeOptimisticRemove]
  );

  /**
   * Restores previous state from a snapshot.
   */
  const rollback = useCallback(
    (snapshot: Suggestion[]) => storeRollback(snapshot),
    [storeRollback]
  );

  // When disabled, return defaults (store may still have data from other consumers)
  if (!enabled) {
    return {
      data: [],
      isLoading: false,
      error: null,
      optimisticUpdateStatus,
      optimisticRemove,
      rollback,
    };
  }
  return { data, isLoading, error, optimisticUpdateStatus, optimisticRemove, rollback };
}
