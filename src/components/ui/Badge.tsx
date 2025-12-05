/**
 * Badge Component - Status and label indicator
 * Used to display step status, roles, owner/expert info, etc.
 */

import type { BadgeProps } from '../../types';

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
};

/**
 * Renders a colored badge for status indicators and labels
 * Supports color variants and optional className for additional styling
 * @param children - Badge content text
 * @param color - Color variant (blue, green, red, amber, slate)
 * @param className - Optional additional CSS classes
 */
export function Badge({ children, color = 'blue', className }: BadgeProps) {
  const colorClass = colorMap[color] || colorMap.slate;

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className || ''}`}
    >
      {children}
    </span>
  );
}
