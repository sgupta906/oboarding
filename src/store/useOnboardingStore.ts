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
import type { OnboardingInstance, Step, StepStatus } from '../types';
import {
  subscribeToOnboardingInstances,
  subscribeToSteps,
  updateStepStatus,
} from '../services/supabase';

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

/** State and actions for the steps slice (keyed by instanceId) */
export interface StepsSlice {
  /** Steps keyed by instanceId. Empty object initially. */
  stepsByInstance: Record<string, Step[]>;
  /** Per-instanceId loading state. Defaults to true when subscription starts. */
  stepsLoadingByInstance: Record<string, boolean>;
  /** Per-instanceId error state. */
  stepsErrorByInstance: Record<string, Error | null>;
  /**
   * Starts a ref-counted realtime subscription for the given instanceId.
   * Multiple calls with the same instanceId share one subscription.
   * Returns a cleanup function that decrements the ref count
   * and unsubscribes when no consumers remain for that instanceId.
   */
  _startStepsSubscription: (instanceId: string) => () => void;
  /**
   * Optimistically updates a step's status, calls the server,
   * and rolls back on error. Re-throws server errors.
   */
  _updateStepStatus: (
    instanceId: string,
    stepId: number,
    status: StepStatus
  ) => Promise<void>;
}

/**
 * Combined store type. Future slices are added via intersection:
 * `type OnboardingStore = InstancesSlice & StepsSlice & UsersSlice;`
 */
export type OnboardingStore = InstancesSlice & StepsSlice;

// ============================================================================
// Module-level subscription lifecycle (ref-counted)
// ============================================================================

let refCount = 0;
let cleanup: (() => void) | null = null;

/** Per-instanceId ref counts for steps subscriptions */
const stepsRefCounts: Map<string, number> = new Map();
/** Per-instanceId cleanup functions for steps subscriptions */
const stepsCleanups: Map<string, () => void> = new Map();

/**
 * Resets module-level ref-counting state for test isolation.
 * Only call this from test `beforeEach` blocks.
 */
export function resetStoreInternals(): void {
  // Reset instances ref-counting
  refCount = 0;
  if (cleanup) {
    cleanup();
    cleanup = null;
  }

  // Reset steps ref-counting
  for (const cleanupFn of stepsCleanups.values()) {
    cleanupFn();
  }
  stepsRefCounts.clear();
  stepsCleanups.clear();
}

// ============================================================================
// Store
// ============================================================================

/** Zustand store for onboarding data shared across all consumers */
export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // -- InstancesSlice state --
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

  // -- StepsSlice state --
  stepsByInstance: {},
  stepsLoadingByInstance: {},
  stepsErrorByInstance: {},

  _startStepsSubscription: (instanceId: string) => {
    const currentCount = stepsRefCounts.get(instanceId) ?? 0;
    stepsRefCounts.set(instanceId, currentCount + 1);

    if (currentCount === 0) {
      // First consumer for this instanceId -- start subscription
      set((state) => ({
        stepsLoadingByInstance: {
          ...state.stepsLoadingByInstance,
          [instanceId]: true,
        },
        stepsErrorByInstance: {
          ...state.stepsErrorByInstance,
          [instanceId]: null,
        },
      }));

      try {
        const unsubscribe = subscribeToSteps(instanceId, (steps: Step[]) => {
          set((state) => ({
            stepsByInstance: {
              ...state.stepsByInstance,
              [instanceId]: steps,
            },
            stepsLoadingByInstance: {
              ...state.stepsLoadingByInstance,
              [instanceId]: false,
            },
          }));
        });
        stepsCleanups.set(instanceId, unsubscribe);
      } catch (err) {
        set((state) => ({
          stepsErrorByInstance: {
            ...state.stepsErrorByInstance,
            [instanceId]:
              err instanceof Error ? err : new Error(String(err)),
          },
          stepsLoadingByInstance: {
            ...state.stepsLoadingByInstance,
            [instanceId]: false,
          },
        }));
      }
    }

    // Return a cleanup function guarded against double invocation
    let cleaned = false;
    return () => {
      if (cleaned) return;
      cleaned = true;

      const count = (stepsRefCounts.get(instanceId) ?? 1) - 1;
      stepsRefCounts.set(instanceId, count);

      if (count === 0) {
        // Last consumer for this instanceId -- unsubscribe and clear state
        const unsubscribe = stepsCleanups.get(instanceId);
        if (unsubscribe) {
          unsubscribe();
        }
        stepsRefCounts.delete(instanceId);
        stepsCleanups.delete(instanceId);

        set((state) => {
          const { [instanceId]: _steps, ...restSteps } = state.stepsByInstance;
          const { [instanceId]: _loading, ...restLoading } =
            state.stepsLoadingByInstance;
          const { [instanceId]: _error, ...restErrors } =
            state.stepsErrorByInstance;
          return {
            stepsByInstance: restSteps,
            stepsLoadingByInstance: restLoading,
            stepsErrorByInstance: restErrors,
          };
        });
      }
    };
  },

  _updateStepStatus: async (
    instanceId: string,
    stepId: number,
    status: StepStatus
  ) => {
    // Capture snapshot for rollback
    const snapshot = get().stepsByInstance[instanceId] ?? [];

    // Optimistic update
    set((state) => ({
      stepsByInstance: {
        ...state.stepsByInstance,
        [instanceId]: (state.stepsByInstance[instanceId] ?? []).map((s) =>
          s.id === stepId ? { ...s, status } : s
        ),
      },
    }));

    try {
      await updateStepStatus(instanceId, stepId, status);
    } catch (err) {
      // Rollback on error
      set((state) => ({
        stepsByInstance: {
          ...state.stepsByInstance,
          [instanceId]: snapshot,
        },
      }));
      throw err;
    }
  },
}));
