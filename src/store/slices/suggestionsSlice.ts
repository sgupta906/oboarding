/**
 * Suggestions Slice - Manages suggestions with ref-counted subscriptions
 * and optimistic state operations
 */

import type { Suggestion, SuggestionStatus } from '../../types';
import type { OnboardingStore } from '../types';
import { subscribeToSuggestions } from '../../services/supabase';

// Module-level ref-counting state
let suggestionsRefCount = 0;
let suggestionsCleanup: (() => void) | null = null;

/** Reset suggestions ref-counting state for test isolation */
export function resetSuggestionsInternals(): void {
  suggestionsRefCount = 0;
  if (suggestionsCleanup) {
    suggestionsCleanup();
    suggestionsCleanup = null;
  }
}

type SetState = (
  partial:
    | Partial<OnboardingStore>
    | ((state: OnboardingStore) => Partial<OnboardingStore>)
) => void;
type GetState = () => OnboardingStore;

/** Creates the suggestions slice state and actions */
export function createSuggestionsSlice(set: SetState, get: GetState) {
  return {
    suggestions: [] as Suggestion[],
    suggestionsLoading: false,
    suggestionsError: null as Error | null,

    _startSuggestionsSubscription: () => {
      suggestionsRefCount++;

      if (suggestionsRefCount === 1) {
        set({ suggestionsLoading: true, suggestionsError: null });

        try {
          suggestionsCleanup = subscribeToSuggestions(
            (suggestions: Suggestion[]) => {
              set({ suggestions, suggestionsLoading: false });
            }
          );
        } catch (err) {
          set({
            suggestionsError:
              err instanceof Error ? err : new Error(String(err)),
            suggestionsLoading: false,
          });
        }
      }

      let cleaned = false;
      return () => {
        if (cleaned) return;
        cleaned = true;
        suggestionsRefCount--;

        if (suggestionsRefCount === 0 && suggestionsCleanup) {
          suggestionsCleanup();
          suggestionsCleanup = null;
          set({
            suggestions: [],
            suggestionsLoading: false,
            suggestionsError: null,
          });
        }
      };
    },

    _optimisticUpdateSuggestionStatus: (
      id: number | string,
      status: SuggestionStatus
    ) => {
      const snapshot = get().suggestions;
      set({
        suggestions: snapshot.map((s) =>
          s.id === id ? { ...s, status } : s
        ),
      });
      return snapshot;
    },

    _optimisticRemoveSuggestion: (id: number | string) => {
      const snapshot = get().suggestions;
      set({ suggestions: snapshot.filter((s) => s.id !== id) });
      return snapshot;
    },

    _rollbackSuggestions: (snapshot: Suggestion[]) => {
      set({ suggestions: snapshot });
    },

    _addSuggestion: (suggestion: Suggestion) => {
      set((state) => ({ suggestions: [...state.suggestions, suggestion] }));
    },
  };
}
