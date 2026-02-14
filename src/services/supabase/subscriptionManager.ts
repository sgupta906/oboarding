/**
 * Shared Subscription Manager
 * Provides reference-counted shared subscriptions to prevent duplicate
 * Supabase Realtime channels when multiple components subscribe to the same data.
 *
 * Usage:
 *   const sharedRoles = createSharedSubscription('roles', subscribeToRoles);
 *   const unsub = sharedRoles.subscribe(callback);
 *   // ... later
 *   unsub(); // Only closes the underlying subscription when ref count hits 0
 */

type SubscribeFn<T> = (callback: (data: T) => void) => () => void;

interface SharedSubscription<T> {
  subscribe: (callback: (data: T) => void) => () => void;
}

/**
 * Creates a shared subscription with reference counting.
 * First subscriber opens the underlying subscription.
 * Subsequent subscribers reuse it and receive cached data immediately.
 * Last unsubscribe closes the underlying subscription.
 *
 * @param key - Unique identifier for this subscription (for debugging)
 * @param subscribeFn - The underlying subscribe function (e.g., subscribeToRoles)
 * @returns An object with a subscribe method
 */
export function createSharedSubscription<T>(
  _key: string,
  subscribeFn: SubscribeFn<T>
): SharedSubscription<T> {
  let callbacks = new Set<(data: T) => void>();
  let cleanup: (() => void) | null = null;
  let lastData: T | undefined = undefined;
  let hasData = false;

  return {
    subscribe(callback: (data: T) => void): () => void {
      let isSubscribed = true;
      callbacks.add(callback);

      // First subscriber - open the underlying subscription
      if (callbacks.size === 1) {
        cleanup = subscribeFn((data: T) => {
          lastData = data;
          hasData = true;
          // Broadcast to all current callbacks
          for (const cb of callbacks) {
            cb(data);
          }
        });
      } else if (hasData) {
        // Subsequent subscriber - deliver cached data immediately
        callback(lastData as T);
      }

      // Return unsubscribe function
      return () => {
        if (!isSubscribed) return;
        isSubscribed = false;

        callbacks.delete(callback);

        // Last subscriber - close the underlying subscription
        if (callbacks.size === 0 && cleanup) {
          cleanup();
          cleanup = null;
          lastData = undefined;
          hasData = false;
        }
      };
    },
  };
}
