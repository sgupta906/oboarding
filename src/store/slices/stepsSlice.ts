/**
 * Steps Slice - Manages per-instance steps with ref-counted subscriptions
 */

import type { Step, StepStatus } from '../../types';
import type { OnboardingStore } from '../types';
import { subscribeToSteps, updateStepStatus } from '../../services/supabase';

// Module-level ref-counting state (per-instanceId)
const stepsRefCounts: Map<string, number> = new Map();
const stepsCleanups: Map<string, () => void> = new Map();

/** Reset steps ref-counting state for test isolation */
export function resetStepsInternals(): void {
  for (const cleanupFn of stepsCleanups.values()) {
    cleanupFn();
  }
  stepsRefCounts.clear();
  stepsCleanups.clear();
}

type SetState = (
  partial:
    | Partial<OnboardingStore>
    | ((state: OnboardingStore) => Partial<OnboardingStore>)
) => void;
type GetState = () => OnboardingStore;

/** Creates the steps slice state and actions */
export function createStepsSlice(set: SetState, get: GetState) {
  return {
    stepsByInstance: {} as Record<string, Step[]>,
    stepsLoadingByInstance: {} as Record<string, boolean>,
    stepsErrorByInstance: {} as Record<string, Error | null>,

    _startStepsSubscription: (instanceId: string) => {
      const currentCount = stepsRefCounts.get(instanceId) ?? 0;
      stepsRefCounts.set(instanceId, currentCount + 1);

      if (currentCount === 0) {
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
          const unsubscribe = subscribeToSteps(
            instanceId,
            (steps: Step[]) => {
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
            }
          );
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

      let cleaned = false;
      return () => {
        if (cleaned) return;
        cleaned = true;

        const count = (stepsRefCounts.get(instanceId) ?? 1) - 1;
        stepsRefCounts.set(instanceId, count);

        if (count === 0) {
          const unsubscribe = stepsCleanups.get(instanceId);
          if (unsubscribe) {
            unsubscribe();
          }
          stepsRefCounts.delete(instanceId);
          stepsCleanups.delete(instanceId);

          set((state) => {
            const { [instanceId]: _steps, ...restSteps } =
              state.stepsByInstance;
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
      // Capture snapshots for rollback (both slices)
      const stepsSnapshot = get().stepsByInstance[instanceId] ?? [];
      const instancesSnapshot = get().instances;

      // Optimistic update -- stepsByInstance
      set((state) => ({
        stepsByInstance: {
          ...state.stepsByInstance,
          [instanceId]: (state.stepsByInstance[instanceId] ?? []).map((s) =>
            s.id === stepId ? { ...s, status } : s
          ),
        },
      }));

      // Optimistic update -- instances (cross-slice sync)
      set((state) => ({
        instances: state.instances.map((inst) => {
          if (inst.id !== instanceId) return inst;
          const updatedSteps = inst.steps.map((s) =>
            s.id === stepId ? { ...s, status } : s
          );
          const completedCount = updatedSteps.filter(
            (s) => s.status === 'completed'
          ).length;
          const progress =
            updatedSteps.length === 0
              ? 0
              : Math.round((completedCount / updatedSteps.length) * 100);
          return {
            ...inst,
            steps: updatedSteps,
            progress,
            status:
              progress === 100
                ? ('completed' as const)
                : inst.status === 'completed'
                  ? ('active' as const)
                  : inst.status,
          };
        }),
      }));

      try {
        await updateStepStatus(instanceId, stepId, status);
      } catch (err) {
        // Rollback both slices on error
        set((state) => ({
          stepsByInstance: {
            ...state.stepsByInstance,
            [instanceId]: stepsSnapshot,
          },
          instances: instancesSnapshot,
        }));
        throw err;
      }
    },
  };
}
