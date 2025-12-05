/**
 * ActivityFeed Component - Live activity log display
 * Shows recent actions from employees during onboarding
 * Features: Collapsable header, scrollable content, action icons, timestamps,
 * hover effects, and empty states. Designed for manager dashboard with variable
 * activity volume - can collapse to save screen space when needed.
 */

import { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Edit,
  Activity as ActivityIcon,
  Undo2,
  ChevronDown,
} from 'lucide-react';
import { Card } from '../ui';
import type { ActivityFeedProps } from '../../types';

/**
 * Get icon based on action type
 */
const getActionIcon = (action: string) => {
  if (action.includes('completed')) {
    return <CheckCircle size={18} className="text-emerald-500" />;
  }
  if (action.includes('marked') && action.includes('pending')) {
    return <Undo2 size={18} className="text-slate-500" />;
  }
  if (action.includes('stuck') || action.includes('report')) {
    return <AlertCircle size={18} className="text-rose-500" />;
  }
  if (action.includes('suggestion')) {
    return <Edit size={18} className="text-blue-500" />;
  }
  return <ActivityIcon size={18} className="text-slate-500" />;
};

/**
 * Renders a list of activity entries in a feed format
 * Displays up to 10 most recent activities with collapsable header
 * Content is scrollable if activity list is long
 * @param activities - Array of activity entries
 */
export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const limitedActivities = activities.slice(0, 10);

  if (limitedActivities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-slate-100">
            <ActivityIcon size={24} className="text-slate-400" />
          </div>
        </div>
        <p className="text-slate-600 font-medium">
          No activity yet
        </p>
        <p className="text-slate-400 text-sm mt-1">
          Employee actions will appear here
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Collapsable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors duration-150 border-b border-slate-100"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse activity feed' : 'Expand activity feed'}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Activity Feed
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {limitedActivities.length}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-600 transition-transform duration-200 ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Activity List - Scrollable Content */}
      {isExpanded && (
        <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-100">
          {limitedActivities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors duration-150 group"
            >
              {/* User Avatar Circle */}
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm group-hover:shadow-md transition-shadow">
                  {activity.userInitials}
                </div>
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 break-words">
                  <span className="font-semibold">{activity.userInitials}</span>{' '}
                  {activity.action}
                </p>
                <p className="text-xs text-slate-500 mt-1">{activity.timeAgo}</p>
              </div>

              {/* Action Icon */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {getActionIcon(activity.action)}
              </div>
            </div>
          ))}

          {/* Show more indicator if there are more activities */}
          {activities.length > 10 && (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 font-medium">
              Showing 10 of {activities.length} activities
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
