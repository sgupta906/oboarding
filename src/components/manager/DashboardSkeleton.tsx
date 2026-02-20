/**
 * DashboardSkeleton Component - Loading placeholder for the Manager Dashboard
 * Mimics the actual ManagerView layout structure with animated pulse elements.
 * Layout: header bar, tab bar, 3 KPI cards, 2-column content grid.
 */

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="max-w-7xl mx-auto px-4 py-8 space-y-8"
    >
      {/* Header skeleton */}
      <div className="animate-pulse h-10 w-64 bg-slate-100 dark:bg-slate-700 rounded-lg" />

      {/* Tab bar skeleton */}
      <div className="flex gap-4">
        <div className="animate-pulse h-8 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
        <div className="animate-pulse h-8 w-20 bg-slate-100 dark:bg-slate-700 rounded" />
        <div className="animate-pulse h-8 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
        <div className="animate-pulse h-8 w-20 bg-slate-100 dark:bg-slate-700 rounded" />
      </div>

      {/* KPI cards skeleton: 3 cards in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="animate-pulse h-24 bg-slate-100 dark:bg-slate-700 rounded-lg" />
        <div className="animate-pulse h-24 bg-slate-100 dark:bg-slate-700 rounded-lg" />
        <div className="animate-pulse h-24 bg-slate-100 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Content grid skeleton: 2-column asymmetric layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-700 rounded-lg" />
        <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-700 rounded-lg" />
      </div>
    </div>
  );
}
