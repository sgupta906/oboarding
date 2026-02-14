/**
 * Debounce Utility
 * Trailing-edge debounce function that batches rapid calls into a single execution.
 * Used to prevent Realtime subscription storms from triggering redundant re-fetches.
 */

/**
 * Creates a debounced version of a function that delays invocation until
 * after `delayMs` milliseconds have elapsed since the last call.
 *
 * @param fn - The function to debounce
 * @param delayMs - Delay in milliseconds (default: 300)
 * @returns A debounced function with a `.cancel()` method
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs = 300
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as T & { cancel: () => void };
}
