/**
 * Activities Slice - Manages activity feed with ref-counted subscriptions
 */

import type { Activity } from '../../types';
import type { OnboardingStore } from '../types';
import { subscribeToActivities } from '../../services/supabase';

// Module-level ref-counting state
let activitiesRefCount = 0;
let activitiesCleanup: (() => void) | null = null;

/** Reset activities ref-counting state for test isolation */
export function resetActivitiesInternals(): void {
  activitiesRefCount = 0;
  if (activitiesCleanup) {
    activitiesCleanup();
    activitiesCleanup = null;
  }
}

type SetState = (
  partial:
    | Partial<OnboardingStore>
    | ((state: OnboardingStore) => Partial<OnboardingStore>)
) => void;

/** Creates the activities slice state and actions */
export function createActivitiesSlice(set: SetState) {
  return {
    activities: [] as Activity[],
    activitiesLoading: false,
    activitiesError: null as Error | null,

    _startActivitiesSubscription: () => {
      activitiesRefCount++;

      if (activitiesRefCount === 1) {
        set({ activitiesLoading: true, activitiesError: null });

        try {
          activitiesCleanup = subscribeToActivities(
            (activities: Activity[]) => {
              set({ activities, activitiesLoading: false });
            }
          );
        } catch (err) {
          set({
            activitiesError:
              err instanceof Error ? err : new Error(String(err)),
            activitiesLoading: false,
          });
        }
      }

      let cleaned = false;
      return () => {
        if (cleaned) return;
        cleaned = true;
        activitiesRefCount--;

        if (activitiesRefCount === 0 && activitiesCleanup) {
          activitiesCleanup();
          activitiesCleanup = null;
          set({
            activities: [],
            activitiesLoading: false,
            activitiesError: null,
          });
        }
      };
    },
  };
}
