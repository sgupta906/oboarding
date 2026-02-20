/**
 * LoadingSpinner Component - Reusable loading indicator with size variants
 * Uses CSS border-spinner technique matching the existing App.tsx loading pattern.
 * Supports sm (inline), md (section), and lg (full-page) sizes.
 * Accessible: role="status" with sr-only fallback text.
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
} as const;

export function LoadingSpinner({ size = 'md', label, className = '' }: LoadingSpinnerProps) {
  const spinnerClasses = `${sizeClasses[size]} border-brand-200 border-t-brand-600 dark:border-brand-800 dark:border-t-brand-400 rounded-full animate-spin`;
  const displayLabel = label || 'Loading...';

  // sm: inline-flex with spinner + visible label side by side
  if (size === 'sm') {
    return (
      <div role="status" className={`inline-flex items-center gap-2 ${className}`}>
        <div className={spinnerClasses} />
        <span className="text-sm text-slate-500 dark:text-slate-400">{displayLabel}</span>
      </div>
    );
  }

  // md/lg: centered block with spinner above label
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={spinnerClasses} />
      <span className="text-sm text-slate-500 dark:text-slate-400">{displayLabel}</span>
    </div>
  );
}
