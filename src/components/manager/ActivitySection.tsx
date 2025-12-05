/**
 * ActivitySection Component - Live activity display
 * Container for showing recent onboarding activity
 * Features: Clear header with icon, visual separation from other sections,
 * responsive design that adapts to different screen sizes.
 * Positioned as secondary (1fr) in asymmetric manager dashboard layout.
 */

import { Clock } from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';
import type { ActivitySectionProps } from '../../types';

/**
 * Renders the live activity section with activity feed
 * Displays in narrower column (1fr) in asymmetric grid layout
 * @param activities - Array of recent activities
 */
export function ActivitySection({ activities }: ActivitySectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Live Activity
          </h2>
        </div>
      </div>
      <ActivityFeed activities={activities} />
    </div>
  );
}
