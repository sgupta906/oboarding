/**
 * UnassignedUsersSection Component
 * Displays users who have signed in (e.g., via Google OAuth) but have no role assigned.
 * Renders above the New Hires table in the manager's New Hires panel.
 * Returns null when no unassigned users exist.
 */

import { useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import type { User } from '../../types';

interface UnassignedUsersSectionProps {
  users: User[];
  onAssign: (user: User) => void;
}

/** Formats a Unix timestamp to a relative time string */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function UnassignedUsersSection({
  users,
  onAssign,
}: UnassignedUsersSectionProps) {
  const unassignedUsers = useMemo(
    () => users.filter((u) => u.roles.length === 0),
    [users],
  );

  if (unassignedUsers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Unassigned Users
        </h3>
        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">
          {unassignedUsers.length}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        These users signed in but have not been assigned a role or onboarding template yet.
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Email
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Signed Up
                </th>
                <th className="px-6 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
              {unassignedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-600 dark:text-slate-300 text-xs font-mono">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {formatTimeAgo(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onAssign(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                      aria-label={`Assign role to ${user.name}`}
                    >
                      <UserPlus size={16} />
                      Assign Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
