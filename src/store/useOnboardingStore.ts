/**
 * useOnboardingStore - Zustand store for onboarding instance data
 *
 * Provides a single source of truth for all onboarding instances,
 * replacing per-component subscriptions with one ref-counted Supabase
 * Realtime subscription shared across all consumers.
 *
 * Future slices (steps, users, activities) extend this store
 * via intersection types: `OnboardingStore = InstancesSlice & StepsSlice & ...`
 */

import { create } from 'zustand';
import type { OnboardingInstance } from '../types';
import { subscribeToOnboardingInstances } from '../services/supabase';

// ============================================================================
// Slice Interface
// ============================================================================

/** State and actions for the onboarding instances slice */
export interface InstancesSlice {
  /** All onboarding instances from the realtime subscription */
  instances: OnboardingInstance[];
  /** Whether the initial data load is in progress */
  instancesLoading: boolean;
  /** Error from subscription setup or data fetch */
  instancesError: Error | null;
  /**
   * Starts the ref-counted instances subscription.
   * Returns a cleanup function that decrements the ref count
   * and unsubscribes when no consumers remain.
   */
  _startInstancesSubscription: () => () => void;
}

/**
 * Combined store type. Future slices are added via intersection:
 * `type OnboardingStore = InstancesSlice & StepsSlice & UsersSlice;`
 */
export type OnboardingStore = InstancesSlice;

// ============================================================================
// Module-level subscription lifecycle (ref-counted)
// ============================================================================

let refCount = 0;
let cleanup: (() => void) | null = null;

/**
 * Resets module-level ref-counting state for test isolation.
 * Only call this from test `beforeEach` blocks.
 */
export function resetStoreInternals(): void {
  refCount = 0;
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}

// ============================================================================
// Store
// ============================================================================

/** Zustand store for onboarding data shared across all consumers */
export const useOnboardingStore = create<OnboardingStore>((set) => ({
  instances: [],
  instancesLoading: false,
  instancesError: null,

  _startInstancesSubscription: () => {
    refCount++;

    if (refCount === 1) {
      // First consumer -- start the real subscription
      set({ instancesLoading: true, instancesError: null });

      try {
        cleanup = subscribeToOnboardingInstances((instances) => {
          set({ instances, instancesLoading: false });
        });
      } catch (err) {
        set({
          instancesError: err instanceof Error ? err : new Error(String(err)),
          instancesLoading: false,
        });
      }
    }

    // Return a cleanup function guarded against double invocation
    let cleaned = false;
    return () => {
      if (cleaned) return;
      cleaned = true;
      refCount--;

      if (refCount === 0 && cleanup) {
        cleanup();
        cleanup = null;
        // Reset state when no consumers remain
        set({ instances: [], instancesLoading: false, instancesError: null });
      }
    };
  },
}));
