/**
 * Instances Slice - Manages onboarding instances with ref-counted subscriptions
 */

import type { OnboardingInstance } from '../../types';
import type { OnboardingStore } from '../types';
import {
  subscribeToOnboardingInstances,
  deleteOnboardingInstance,
  updateOnboardingInstance,
} from '../../services/supabase';

// Module-level ref-counting state
let refCount = 0;
let cleanup: (() => void) | null = null;

/** Reset instances ref-counting state for test isolation */
export function resetInstancesInternals(): void {
  refCount = 0;
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}

type SetState = (
  partial:
    | Partial<OnboardingStore>
    | ((state: OnboardingStore) => Partial<OnboardingStore>)
) => void;
type GetState = () => OnboardingStore;

/** Creates the instances slice state and actions */
export function createInstancesSlice(set: SetState, get: GetState) {
  return {
    instances: [] as OnboardingInstance[],
    instancesLoading: false,
    instancesError: null as Error | null,

    _startInstancesSubscription: () => {
      refCount++;

      if (refCount === 1) {
        set({ instancesLoading: true, instancesError: null });

        try {
          cleanup = subscribeToOnboardingInstances((instances) => {
            set({ instances, instancesLoading: false });
          });
        } catch (err) {
          set({
            instancesError:
              err instanceof Error ? err : new Error(String(err)),
            instancesLoading: false,
          });
        }
      }

      let cleaned = false;
      return () => {
        if (cleaned) return;
        cleaned = true;
        refCount--;

        if (refCount === 0 && cleanup) {
          cleanup();
          cleanup = null;
          set({ instances: [], instancesLoading: false, instancesError: null });
        }
      };
    },

    _addInstance: (instance: OnboardingInstance) => {
      set((state) => ({
        instances: [...state.instances, instance],
      }));
    },

    _removeInstance: async (instanceId: string) => {
      try {
        await deleteOnboardingInstance(instanceId);
        set((state) => ({
          instances: state.instances.filter((i) => i.id !== instanceId),
        }));
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to delete onboarding instance';
        throw new Error(msg);
      }
    },

    _updateInstance: async (
      instanceId: string,
      updates: Partial<OnboardingInstance>
    ) => {
      const snapshot = get().instances;
      set((state) => ({
        instances: state.instances.map((i) =>
          i.id === instanceId ? { ...i, ...updates } : i
        ),
      }));
      try {
        await updateOnboardingInstance(instanceId, updates);
      } catch (err) {
        set({ instances: snapshot });
        throw err;
      }
    },
  };
}
