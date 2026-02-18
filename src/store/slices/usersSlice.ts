/**
 * Users Slice - Manages system users with ref-counted subscriptions
 */

import type { User, UserFormData } from '../../types';
import type { OnboardingStore } from '../types';
import {
  subscribeToUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,
} from '../../services/supabase';

// Module-level ref-counting state
let usersRefCount = 0;
let usersCleanup: (() => void) | null = null;

/** Reset users ref-counting state for test isolation */
export function resetUsersInternals(): void {
  usersRefCount = 0;
  if (usersCleanup) {
    usersCleanup();
    usersCleanup = null;
  }
}

type SetState = (
  partial:
    | Partial<OnboardingStore>
    | ((state: OnboardingStore) => Partial<OnboardingStore>)
) => void;
type GetState = () => OnboardingStore;

/** Creates the users slice state and actions */
export function createUsersSlice(set: SetState, get: GetState) {
  return {
    users: [] as User[],
    usersLoading: false,
    usersError: null as string | null,

    _startUsersSubscription: () => {
      usersRefCount++;

      if (usersRefCount === 1) {
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

      let cleaned = false;
      return () => {
        if (cleaned) return;
        cleaned = true;
        usersRefCount--;

        if (usersRefCount === 0 && usersCleanup) {
          usersCleanup();
          usersCleanup = null;
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
      set((state) => ({
        users: state.users.map((u) =>
          u.id === userId ? { ...u, ...data } : u
        ),
      }));
      try {
        await updateUser(userId, data);
      } catch (err) {
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
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
        }));
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
  };
}
