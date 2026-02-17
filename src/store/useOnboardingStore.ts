/**
 * useOnboardingStore - Zustand store for onboarding data
 *
 * Provides a single source of truth for onboarding instances, steps, users,
 * activities, and suggestions, replacing per-component subscriptions with
 * ref-counted Supabase Realtime subscriptions shared across all consumers.
 *
 * Slices: InstancesSlice, StepsSlice, UsersSlice, ActivitiesSlice, SuggestionsSlice
 */

import { create } from 'zustand';
import type {
  OnboardingInstance,
  Step,
  StepStatus,
  User,
  UserFormData,
  Activity,
  Suggestion,
  SuggestionStatus,
} from '../types';
import {
  subscribeToOnboardingInstances,
  subscribeToSteps,
  updateStepStatus,
  deleteOnboardingInstance,
  updateOnboardingInstance,
  subscribeToUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  subscribeToActivities,
  subscribeToSuggestions,
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
  /** Optimistically appends a newly created instance to the store. */
  _addInstance: (instance: OnboardingInstance) => void;
  /** Deletes an instance via server, then removes from local state. Re-throws on error. */
  _removeInstance: (instanceId: string) => Promise<void>;
  /** Optimistic update + rollback on error. Re-throws on error. */
  _updateInstance: (instanceId: string, updates: Partial<OnboardingInstance>) => Promise<void>;
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

/** State and actions for the users slice (flat array, scalar ref-counting) */
export interface UsersSlice {
  /** All system users from the realtime subscription */
  users: User[];
  /** Whether the initial data load is in progress */
  usersLoading: boolean;
  /** Error from subscription setup or CRUD operations (string, not Error) */
  usersError: string | null;

  /** Starts the ref-counted users subscription. Returns cleanup function. */
  _startUsersSubscription: () => () => void;
  /** Creates a user, appends to local state. Re-throws on error. */
  _createUser: (data: UserFormData, createdBy: string) => Promise<User>;
  /** Optimistic update + rollback on error. Re-throws on error. */
  _editUser: (userId: string, data: Partial<UserFormData>) => Promise<void>;
  /** Deletes via server, then removes from local state. Re-throws on error. */
  _removeUser: (userId: string) => Promise<void>;
  /** Fetches single user from server. Does not modify store state. Re-throws on error. */
  _fetchUser: (userId: string) => Promise<User | null>;
  /** Clears usersError. */
  _resetUsersError: () => void;
}

/** State and actions for the activities slice (read-only, scalar ref-counting) */
export interface ActivitiesSlice {
  /** All activities from the realtime subscription */
  activities: Activity[];
  /** Whether the initial data load is in progress */
  activitiesLoading: boolean;
  /** Error from subscription setup */
  activitiesError: Error | null;
  /**
   * Starts the ref-counted activities subscription.
   * Returns a cleanup function that decrements the ref count
   * and unsubscribes when no consumers remain.
   */
  _startActivitiesSubscription: () => () => void;
}

/** State and actions for the suggestions slice (subscription + optimistic state ops) */
export interface SuggestionsSlice {
  /** All suggestions from the realtime subscription */
  suggestions: Suggestion[];
  /** Whether the initial data load is in progress */
  suggestionsLoading: boolean;
  /** Error from subscription setup */
  suggestionsError: Error | null;
  /**
   * Starts the ref-counted suggestions subscription.
   * Returns a cleanup function that decrements the ref count
   * and unsubscribes when no consumers remain.
   */
  _startSuggestionsSubscription: () => () => void;
  /**
   * Optimistically updates a suggestion's status.
   * Returns the pre-mutation snapshot for rollback.
   */
  _optimisticUpdateSuggestionStatus: (
    id: number | string,
    status: SuggestionStatus
  ) => Suggestion[];
  /**
   * Optimistically removes a suggestion.
   * Returns the pre-mutation snapshot for rollback.
   */
  _optimisticRemoveSuggestion: (id: number | string) => Suggestion[];
  /**
   * Restores suggestions from a snapshot.
   */
  _rollbackSuggestions: (snapshot: Suggestion[]) => void;
  /** Optimistically appends a newly created suggestion to the store. */
  _addSuggestion: (suggestion: Suggestion) => void;
}

/**
 * Combined store type. All slices are composed via intersection.
 */
export type OnboardingStore = InstancesSlice &
  StepsSlice &
  UsersSlice &
  ActivitiesSlice &
  SuggestionsSlice;

// ============================================================================
// Module-level subscription lifecycle (ref-counted)
// ============================================================================

let refCount = 0;
let cleanup: (() => void) | null = null;

/** Per-instanceId ref counts for steps subscriptions */
const stepsRefCounts: Map<string, number> = new Map();
/** Per-instanceId cleanup functions for steps subscriptions */
const stepsCleanups: Map<string, () => void> = new Map();

/** Scalar ref count for the global users subscription */
let usersRefCount = 0;
/** Cleanup function for the active users subscription */
let usersCleanup: (() => void) | null = null;

/** Scalar ref count for the global activities subscription */
let activitiesRefCount = 0;
/** Cleanup function for the active activities subscription */
let activitiesCleanup: (() => void) | null = null;

/** Scalar ref count for the global suggestions subscription */
let suggestionsRefCount = 0;
/** Cleanup function for the active suggestions subscription */
let suggestionsCleanup: (() => void) | null = null;

/**
 * Resets module-level ref-counting state for test isolation.
 * Clears instances, steps, users, activities, and suggestions
 * ref-counts and cleanup functions.
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

  // Reset users ref-counting
  usersRefCount = 0;
  if (usersCleanup) {
    usersCleanup();
    usersCleanup = null;
  }

  // Reset activities ref-counting
  activitiesRefCount = 0;
  if (activitiesCleanup) {
    activitiesCleanup();
    activitiesCleanup = null;
  }

  // Reset suggestions ref-counting
  suggestionsRefCount = 0;
  if (suggestionsCleanup) {
    suggestionsCleanup();
    suggestionsCleanup = null;
  }
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
        err instanceof Error ? err.message : 'Failed to delete onboarding instance';
      throw new Error(msg);
    }
  },

  _updateInstance: async (instanceId: string, updates: Partial<OnboardingInstance>) => {
    // Capture snapshot for rollback
    const snapshot = get().instances;
    // Optimistic update
    set((state) => ({
      instances: state.instances.map((i) =>
        i.id === instanceId ? { ...i, ...updates } : i
      ),
    }));
    try {
      await updateOnboardingInstance(instanceId, updates);
    } catch (err) {
      // Rollback on error
      set({ instances: snapshot });
      throw err;
    }
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

  // -- UsersSlice state --
  users: [],
  usersLoading: false,
  usersError: null,

  _startUsersSubscription: () => {
    usersRefCount++;

    if (usersRefCount === 1) {
      // First consumer -- start the real subscription
      set({ usersLoading: true, usersError: null });

      try {
        usersCleanup = subscribeToUsers((users: User[]) => {
          set({ users, usersLoading: false });
        });
      } catch (err) {
        set({
          usersError: err instanceof Error ? err.message : String(err),
          usersLoading: false,
        });
      }
    }

    // Return a cleanup function guarded against double invocation
    let cleaned = false;
    return () => {
      if (cleaned) return;
      cleaned = true;
      usersRefCount--;

      if (usersRefCount === 0 && usersCleanup) {
        usersCleanup();
        usersCleanup = null;
        // Reset state when no consumers remain
        set({ users: [], usersLoading: false, usersError: null });
      }
    };
  },

  _createUser: async (data: UserFormData, createdBy: string) => {
    set({ usersError: null });
    try {
      const newUser = await createUser({ ...data, createdBy }, createdBy);
      set((state) => ({ users: [...state.users, newUser] }));
      return newUser;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create user';
      set({ usersError: msg });
      throw new Error(msg);
    }
  },

  _editUser: async (userId: string, data: Partial<UserFormData>) => {
    set({ usersError: null });
    const snapshot = get().users;
    // Optimistic update
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, ...data } : u
      ),
    }));
    try {
      await updateUser(userId, data);
    } catch (err) {
      // Rollback on error
      set({ users: snapshot });
      const msg =
        err instanceof Error ? err.message : 'Failed to update user';
      set({ usersError: msg });
      throw new Error(msg);
    }
  },

  _removeUser: async (userId: string) => {
    set({ usersError: null });
    try {
      await deleteUser(userId);
      set((state) => ({ users: state.users.filter((u) => u.id !== userId) }));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to delete user';
      set({ usersError: msg });
      throw new Error(msg);
    }
  },

  _fetchUser: async (userId: string) => {
    set({ usersError: null });
    try {
      return await getUser(userId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch user';
      set({ usersError: msg });
      throw new Error(msg);
    }
  },

  _resetUsersError: () => {
    set({ usersError: null });
  },

  // -- ActivitiesSlice state --
  activities: [],
  activitiesLoading: false,
  activitiesError: null,

  _startActivitiesSubscription: () => {
    activitiesRefCount++;

    if (activitiesRefCount === 1) {
      // First consumer -- start the real subscription
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

    // Return a cleanup function guarded against double invocation
    let cleaned = false;
    return () => {
      if (cleaned) return;
      cleaned = true;
      activitiesRefCount--;

      if (activitiesRefCount === 0 && activitiesCleanup) {
        activitiesCleanup();
        activitiesCleanup = null;
        // Reset state when no consumers remain
        set({
          activities: [],
          activitiesLoading: false,
          activitiesError: null,
        });
      }
    };
  },

  // -- SuggestionsSlice state --
  suggestions: [],
  suggestionsLoading: false,
  suggestionsError: null,

  _startSuggestionsSubscription: () => {
    suggestionsRefCount++;

    if (suggestionsRefCount === 1) {
      // First consumer -- start the real subscription
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

    // Return a cleanup function guarded against double invocation
    let cleaned = false;
    return () => {
      if (cleaned) return;
      cleaned = true;
      suggestionsRefCount--;

      if (suggestionsRefCount === 0 && suggestionsCleanup) {
        suggestionsCleanup();
        suggestionsCleanup = null;
        // Reset state when no consumers remain
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
}));
