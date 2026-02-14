/**
 * Time Utilities
 * Provides relative timestamp formatting for activity feeds and UI display.
 */

/**
 * Converts a Unix millisecond timestamp to a human-readable relative time string.
 * @param timestamp - Unix milliseconds (e.g., Date.now())
 * @returns Relative time string: "just now", "5m ago", "2h ago", "yesterday", "3d ago", or '' for invalid input
 */
export function formatTimeAgo(timestamp: number | undefined): string {
  if (!timestamp) return '';

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  // Future timestamps or less than 60 seconds ago
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return 'yesterday';
  return `${Math.floor(seconds / 86400)}d ago`;
}
