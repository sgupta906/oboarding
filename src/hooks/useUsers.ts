/**
 * useUsers Hook - Custom hook for user management
 * Provides CRUD operations for users with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  subscribeToUsers,
} from '../services/userOperations';
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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time user updates
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Create a new user
  const createNewUser = useCallback(async (data: UserFormData, createdBy: string): Promise<User> => {
    setError(null);
    try {
      const newUser = await createUser({ ...data, createdBy }, createdBy);
      // Immediately update local state to ensure UI reflects the new user
      // The subscription will also fire, but this ensures immediate feedback
      setUsers((prevUsers) => [...prevUsers, newUser]);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Update an existing user
  const editUser = useCallback(async (userId: string, data: Partial<UserFormData>): Promise<void> => {
    setError(null);
    try {
      await updateUser(userId, data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Delete a user
  const removeUser = useCallback(async (userId: string): Promise<void> => {
    setError(null);
    try {
      await deleteUser(userId);
      // Immediately update local state to remove the user from the list
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Fetch a single user by ID
  const fetchUser = useCallback(async (userId: string): Promise<User | null> => {
    setError(null);
    try {
      return await getUser(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Reset error state
  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    users,
    isLoading,
    error,
    createNewUser,
    editUser,
    removeUser,
    fetchUser,
    reset,
  };
}
