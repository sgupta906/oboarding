/**
 * useOnboardingStore - Zustand store for onboarding data
 *
 * Provides a single source of truth for onboarding instances, steps, and users,
 * replacing per-component subscriptions with ref-counted Supabase
 * Realtime subscriptions shared across all consumers.
 *
 * Slices: InstancesSlice, StepsSlice, UsersSlice
 * Future slices (activities, suggestions) extend this store
 * via intersection types: `OnboardingStore = InstancesSlice & StepsSlice & UsersSlice & ...`
 */

import { create } from 'zustand';
import type {
  OnboardingInstance,
  Step,
  StepStatus,
  User,
  UserFormData,
} from '../types';
import {
  subscribeToOnboardingInstances,
  subscribeToSteps,
  updateStepStatus,
  subscribeToUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,
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

/**
 * Combined store type. Future slices are added via intersection:
 * `type OnboardingStore = InstancesSlice & StepsSlice & UsersSlice & ...;`
 */
export type OnboardingStore = InstancesSlice & StepsSlice & UsersSlice;

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

/**
 * Resets module-level ref-counting state for test isolation.
 * Clears instances, steps, and users ref-counts and cleanup functions.
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
}));
