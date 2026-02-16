/**
 * useUsers Hook - Custom hook for user management
 *
 * Thin wrapper over the Zustand UsersSlice. Reads state via selectors
 * and delegates CRUD operations to store actions. The realtime subscription
 * is ref-counted in the store so multiple consumers share one channel.
 */

import { useEffect, useCallback } from 'react';
import { useOnboardingStore } from '../store';
import type { User, UserFormData } from '../types';

interface UseUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  createNewUser: (data: UserFormData, createdBy: string) => Promise<User>;
  editUser: (userId: string, data: Partial<UserFormData>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  fetchUser: (userId: string) => Promise<User | null>;
  reset: () => void;
}

/**
 * Custom hook for managing users with real-time subscriptions
 * @returns Object with users list, loading state, error state, and CRUD functions
 */
export function useUsers(): UseUsersReturn {
  const users = useOnboardingStore((s) => s.users);
  const isLoading = useOnboardingStore((s) => s.usersLoading);
  const error = useOnboardingStore((s) => s.usersError);

  // Start the ref-counted subscription on mount, clean up on unmount
  useEffect(() => {
    const unsub = useOnboardingStore.getState()._startUsersSubscription();
    return unsub;
  }, []);

  const createNewUser = useCallback(
    (data: UserFormData, createdBy: string) =>
      useOnboardingStore.getState()._createUser(data, createdBy),
    []
  );

  const editUser = useCallback(
    (userId: string, data: Partial<UserFormData>) =>
      useOnboardingStore.getState()._editUser(userId, data),
    []
  );

  const removeUser = useCallback(
    (userId: string) => useOnboardingStore.getState()._removeUser(userId),
    []
  );

  const fetchUser = useCallback(
    (userId: string) => useOnboardingStore.getState()._fetchUser(userId),
    []
  );

  const reset = useCallback(
    () => useOnboardingStore.getState()._resetUsersError(),
    []
  );

  return { users, isLoading, error, createNewUser, editUser, removeUser, fetchUser, reset };
}
