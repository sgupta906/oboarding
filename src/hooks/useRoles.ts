/**
 * useRoles Hook - Custom React hook for role management
 * Subscribes to real-time role updates and provides CRUD operations
 * Handles errors gracefully with user-friendly messages
 *
 * Note: Uses Supabase Realtime subscription for automatic updates.
 */

import { useEffect, useState, useCallback } from 'react';
import { subscribeToRoles } from '../services/supabase';
import {
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
} from '../services/roleClient';
import type { CustomRole } from '../types';

interface UseRolesReturn {
  roles: CustomRole[];
  isLoading: boolean;
  error: string | null;
  createRole: (
    name: string,
    description?: string,
    createdBy?: string
  ) => Promise<CustomRole>;
  updateRole: (
    roleId: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  refetch: () => void;
}

/**
 * Custom hook for managing custom roles
 * Subscribes to real-time updates and provides CRUD operations
 * Subscribes to Supabase Realtime for automatic role updates
 * Handles all errors with user-friendly messages
 *
 * @param userId - Current user ID for role creation operations (defaults to 'system')
 * @returns Object with roles data, loading state, error state, and operations
 */
export function useRoles(userId?: string): UseRolesReturn {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCount, setRefetchCount] = useState<number>(0);

  const refetch = useCallback(() => {
    setRefetchCount((prev) => prev + 1);
  }, []);

  // Subscribe to real-time role updates via Supabase Realtime
  useEffect(() => {
    // Reset loading state when refetch is triggered
    setIsLoading(true);
    setError(null);

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToRoles((updatedRoles: CustomRole[]) => {
        setRoles(updatedRoles);
        setIsLoading(false);
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to subscribe to roles. Please refresh the page.';
      setError(errorMessage);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount or refetch
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refetchCount]);

  // Create role with error handling
  const createRole = useCallback(
    async (
      name: string,
      description?: string,
      createdBy?: string
    ): Promise<CustomRole> => {
      try {
        setError(null);
        const newRole = await createCustomRole(name, description, createdBy ?? userId ?? null);
        // Optimistic: update local state immediately (Realtime reconciles later)
        setRoles(prev => [...prev, newRole]);
        return newRole;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to create role. Please try again.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [userId]
  );

  // Update role with error handling
  const updateRole = useCallback(
    async (
      roleId: string,
      updates: { name?: string; description?: string }
    ): Promise<void> => {
      try {
        setError(null);
        await updateCustomRole(roleId, updates);
        // Optimistic: update local state immediately
        setRoles(prev => prev.map(r =>
          r.id === roleId ? { ...r, ...updates, updatedAt: Date.now() } : r
        ));
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update role. Please try again.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  // Delete role with error handling
  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      setError(null);
      await deleteCustomRole(roleId);
      // Optimistic: remove from local state immediately
      setRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete role. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return { roles, isLoading, error, createRole, updateRole, deleteRole, refetch };
}
