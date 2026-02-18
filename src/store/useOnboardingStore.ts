/**
 * useOnboardingStore - Zustand store composition
 *
 * Composes all slices into a single store. Each slice manages its own
 * ref-counted Supabase Realtime subscription and state.
 */

import { create } from 'zustand';
import type { OnboardingStore } from './types';
import {
  createInstancesSlice,
  createStepsSlice,
  createUsersSlice,
  createActivitiesSlice,
  createSuggestionsSlice,
  resetInstancesInternals,
  resetStepsInternals,
  resetUsersInternals,
  resetActivitiesInternals,
  resetSuggestionsInternals,
} from './slices';

/** Zustand store for onboarding data shared across all consumers */
export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...createInstancesSlice(set, get),
  ...createStepsSlice(set, get),
  ...createUsersSlice(set, get),
  ...createActivitiesSlice(set),
  ...createSuggestionsSlice(set, get),
}));

/**
 * Resets module-level ref-counting state for test isolation.
 * Clears instances, steps, users, activities, and suggestions
 * ref-counts and cleanup functions.
 * Only call this from test `beforeEach` blocks.
 */
export function resetStoreInternals(): void {
  resetInstancesInternals();
  resetStepsInternals();
  resetUsersInternals();
  resetActivitiesInternals();
  resetSuggestionsInternals();
}
