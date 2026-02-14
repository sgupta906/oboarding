/**
 * useTemplates Hook - Subscribes to real-time template updates
 * Manages subscription lifecycle and provides loading/error states
 * Includes CRUD wrappers with optimistic local state updates
 *
 * Performance: Includes timeout fallback to prevent infinite loading
 */

import { useEffect, useState, useCallback } from 'react';
import {
  subscribeToTemplates,
  createTemplate as svcCreateTemplate,
  updateTemplate as svcUpdateTemplate,
  deleteTemplate as svcDeleteTemplate,
} from '../services/supabase';
import type { Template } from '../types';

interface UseTemplatesReturn {
  data: Template[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  create: (template: Omit<Template, 'id' | 'createdAt'>) => Promise<string>;
  update: (id: string, updates: Partial<Template>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Custom hook for subscribing to templates with real-time updates
 * Automatically manages subscription and cleanup on unmount
 * Includes 3-second timeout fallback to prevent infinite loading
 * Provides CRUD wrappers that optimistically update local state
 * @returns Object with templates data, loading state, error state, and CRUD functions
 */
export function useTemplates(): UseTemplatesReturn {
  const [data, setData] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCount, setRefetchCount] = useState<number>(0);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  const refetch = useCallback(() => {
    setTimedOut(false);
    setRefetchCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Reset loading state when refetch is triggered
    setIsLoading(true);
    setError(null);
    setTimedOut(false);

    let unsubscribe: (() => void) | null = null;
    let hasReceivedData = false;

    // Timeout fallback to prevent infinite loading (3 seconds)
    const timeoutId = setTimeout(() => {
      if (!hasReceivedData) {
        console.warn('Templates subscription timed out - using empty fallback');
        setTimedOut(true);
        setIsLoading(false);
      }
    }, 3000);

    try {
      unsubscribe = subscribeToTemplates((templates: Template[]) => {
        hasReceivedData = true;
        clearTimeout(timeoutId);
        setData(templates);
        setIsLoading(false);
        setTimedOut(false);
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount or refetch
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refetchCount]);

  // CRUD wrappers with optimistic local state updates

  const create = useCallback(async (template: Omit<Template, 'id' | 'createdAt'>): Promise<string> => {
    const id = await svcCreateTemplate(template);
    // Optimistic: add to local state immediately
    const optimistic: Template = { ...template, id, createdAt: Date.now() };
    setData(prev => [...prev, optimistic]);
    return id;
  }, []);

  const update = useCallback(async (id: string, updates: Partial<Template>): Promise<void> => {
    await svcUpdateTemplate(id, updates);
    // Optimistic: update local state immediately
    setData(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
    ));
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    await svcDeleteTemplate(id);
    // Optimistic: remove from local state immediately
    setData(prev => prev.filter(t => t.id !== id));
  }, []);

  // If timed out, treat as loaded with empty data (not an error)
  const effectiveLoading = !timedOut && isLoading;

  return { data, isLoading: effectiveLoading, error, refetch, create, update, remove };
}
