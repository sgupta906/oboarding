/**
 * KPICard Component - Key Performance Indicator display
 * Shows metrics like active onboardings, stuck employees, etc.
 * Features: hover effects, subtle animations, and optional tooltips
 */

import { useState } from 'react';
import { Card } from '../ui';
import type { KPICardProps } from '../../types';

const colorBgMap = {
  success: 'bg-emerald-50 border-l-emerald-500 hover:bg-emerald-100',
  error: 'bg-rose-50 border-l-rose-500 hover:bg-rose-100',
  warning: 'bg-amber-50 border-l-amber-500 hover:bg-amber-100',
};

const colorTextMap = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  warning: 'text-amber-600',
};

const colorIconBgMap = {
  success: 'bg-emerald-100 text-emerald-600',
  error: 'bg-rose-100 text-rose-600',
  warning: 'bg-amber-100 text-amber-600',
};

interface EnhancedKPICardProps extends KPICardProps {
  tooltip?: string;
}

/**
 * Renders a KPI metric card with icon, value, and interactive features
 * Includes hover effects, smooth transitions, and optional tooltips
 * @param label - Metric label/title
 * @param value - The metric value
 * @param subtext - Optional secondary text (e.g., "Needs attention")
 * @param icon - React icon element
 * @param color - Color scheme (success, error, warning)
 * @param tooltip - Optional tooltip text shown on hover
 */
export function KPICard({
  label,
  value,
  subtext,
  icon,
  color,
  tooltip,
}: EnhancedKPICardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative h-full">
      <Card
        className={`p-6 border-l-4 transition-all duration-200 hover:shadow-md cursor-help relative h-full flex flex-col ${colorBgMap[color]}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <h3 className="text-4xl font-bold text-slate-900 mt-2 transition-transform duration-200 hover:scale-105">
              {value}
            </h3>
          </div>
          <div
            className={`p-3 rounded-lg transition-transform duration-200 hover:scale-110 ${colorIconBgMap[color]}`}
          >
            {icon}
          </div>
        </div>
        {subtext && (
          <p
            className={`text-xs mt-4 font-medium ${colorTextMap[color]}`}
          >
            {subtext}
          </p>
        )}
      </Card>

      {/* Tooltip - pointer-events-none prevents layout shifts during hover */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap z-10 animate-fadeIn pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
