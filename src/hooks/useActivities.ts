/**
 * useActivities Hook - Subscribes to real-time activity updates
 * Manages subscription lifecycle and provides loading/error states
 *
 * Performance: Accepts enabled parameter to conditionally enable the subscription
 */

import { useEffect, useState } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { subscribeToActivities } from '../services/dataClient';
import { Activity } from '../types';

interface UseActivitiesReturn {
  data: Activity[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for subscribing to all activities
 * Automatically manages subscription and cleanup on unmount
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Object with activities data, loading state, and error state
 */
export function useActivities(enabled: boolean = true): UseActivitiesReturn {
  const [data, setData] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip subscription if not enabled
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let unsubscribe: Unsubscribe | null = null;

    try {
      unsubscribe = subscribeToActivities((activities: Activity[]) => {
        setData(activities);
        setIsLoading(false);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled]);

  return { data, isLoading, error };
}
