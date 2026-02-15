/**
 * SuggestionCard Component - Display documentation feedback suggestions
 * Shows suggestion details with timestamps, priority indicators, and approve/reject actions
 */

import { CheckCircle, X, AlertCircle } from 'lucide-react';
import { Card, Badge } from '../ui';
import type { SuggestionCardProps } from '../../types';

/**
 * Calculate time ago string from timestamp
 * Assumes timestamps are numeric (milliseconds from epoch)
 */
const getTimeAgo = (timestamp: number | string): string => {
  if (typeof timestamp === 'string') {
    return timestamp; // Already formatted
  }
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return 'more than a week ago';
};

/**
 * Renders a suggestion card with action buttons
 * Includes timestamps, step badges, user info, and approve/reject actions
 * @param suggestion - The suggestion data
 * @param stepTitle - Title of the step being suggested
 * @param onApprove - Callback when approving the suggestion
 * @param onReject - Callback when rejecting the suggestion
 */
export function SuggestionCard({
  suggestion,
  stepTitle,
  onApprove,
  onReject,
  isLoading = false,
}: SuggestionCardProps) {
  // Use timestamp if available, otherwise use creation time
  const createdAt = ((suggestion as unknown) as { createdAt?: number }).createdAt || Date.now();
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Card className="p-4 border-l-2 border-l-amber-300 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge color="amber">
            {stepTitle.substring(0, 20)}
            {stepTitle.length > 20 ? '...' : ''}
          </Badge>
          {/* Priority indicator - optional, can be based on step frequency */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <AlertCircle size={12} />
            Pending
          </div>
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo}</span>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
        {suggestion.text}
      </p>

      <div className="flex justify-between items-center">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Suggested by{' '}
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            {suggestion.user}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { if (!isLoading) onApprove(suggestion.id); }}
            disabled={isLoading}
            className={`p-2 hover:bg-emerald-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all duration-150 hover:scale-110 ${isLoading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            title="Approve suggestion"
            aria-label={`Approve suggestion from ${suggestion.user}`}
          >
            <CheckCircle size={18} />
          </button>
          <button
            onClick={() => { if (!isLoading) onReject(suggestion.id); }}
            disabled={isLoading}
            className={`p-2 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-all duration-150 hover:scale-110 ${isLoading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            title="Reject suggestion"
            aria-label={`Reject suggestion from ${suggestion.user}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </Card>
  );
}
