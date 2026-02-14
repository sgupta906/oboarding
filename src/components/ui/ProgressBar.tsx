/**
 * ProgressBar Component - Reusable progress indicator
 * Displays a visual progress bar with percentage text
 */

import type { ProgressBarProps } from '../../types';

const variantMap = {
  default: 'bg-brand-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-rose-600',
};

/**
 * Renders a progress bar with optional label and percentage display
 * @param value - Progress percentage (0-100)
 * @param label - Optional label text above the bar
 * @param showPercentage - Whether to show percentage text
 * @param variant - Color variant
 * @param className - Additional Tailwind classes
 */
export function ProgressBar({
  value,
  label,
  showPercentage = true,
  variant = 'default',
  className = '',
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const variantClass = variantMap[variant];

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm font-medium mb-2">
          {label && <span>{label}</span>}
          {showPercentage && <span>{clampedValue}%</span>}
        </div>
      )}
      <div
        className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${variantClass} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
