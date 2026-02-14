/**
 * StepCard Component - Individual onboarding step card
 * Displays step details, status, and available actions with smooth animations
 */

import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '../ui';
import { ActionBar } from './ActionBar';
import type { StepCardProps } from '../../types';

/**
 * Renders a single step card with content and actions
 * Includes visual indicators for step status, completion, and stuck states
 * Animations smooth transitions between states
 * @param step - The step data
 * @param index - Position in the list (for numbering)
 * @param onStatusChange - Callback for status updates
 * @param onSuggestEdit - Callback to open suggest edit modal
 * @param onReportStuck - Callback to open report stuck modal
 */
export function StepCard({
  step,
  index,
  onStatusChange,
  onSuggestEdit,
  onReportStuck,
}: StepCardProps) {
  const borderColorMap = {
    stuck: 'border-l-rose-500 ring-2 ring-rose-100 dark:ring-rose-900 bg-rose-50/30 dark:bg-rose-950/20',
    completed: 'border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20',
    pending: 'border-l-brand-500',
  };

  const indicatorBgMap = {
    stuck: 'bg-rose-500 animate-pulse ring-2 ring-rose-200',
    completed: 'bg-emerald-500',
    pending: 'bg-brand-600',
  };

  const isStuck = step.status === 'stuck';
  const isCompleted = step.status === 'completed';

  return (
    <div
      className={`transition-all duration-300 ease-out transform ${
        isCompleted ? 'opacity-60' : 'opacity-100'
      }`}
      role="article"
      aria-label={`Step ${index + 1}: ${step.title} (${step.status})`}
    >
      <Card className={`p-6 border-l-4 transition-all duration-300 ${borderColorMap[step.status]}`}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Step Indicator - Desktop only */}
          <div className="hidden md:flex flex-col items-center flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-all duration-300 ${
                indicatorBgMap[step.status]
              }`}
              aria-label={`Step number indicator showing ${
                isCompleted ? 'completed' : index + 1
              }`}
            >
              {isCompleted ? (
                <CheckCircle size={20} className="animate-in zoom-in duration-300" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {/* Visual progress connector line below (hidden for last step on mobile) */}
            <div className="hidden md:block w-0.5 h-6 mt-1 bg-slate-200 dark:bg-slate-600" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2 gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  {step.title}
                  {isStuck && (
                    <Badge
                      color="red"
                      className="inline-flex items-center gap-1 animate-pulse"
                    >
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      STUCK
                    </Badge>
                  )}
                  {isCompleted && (
                    <CheckCircle
                      size={16}
                      className="text-emerald-500 flex-shrink-0"
                      aria-label="Completed"
                    />
                  )}
                </h3>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge color="slate">
                    <span className="font-medium">Owner:</span> {step.owner}
                  </Badge>
                  <Badge color="blue">
                    <span className="font-medium">Expert:</span> {step.expert}
                  </Badge>
                  {isStuck && (
                    <Badge color="red" className="bg-rose-100 text-rose-700">
                      Waiting for {step.expert}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Description with status-specific styling */}
            <p
              className={`leading-relaxed mb-4 transition-colors duration-300 ${
                isCompleted
                  ? 'text-slate-500 dark:text-slate-500 line-through'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              aria-live="polite"
            >
              {step.description}
            </p>

            {/* Status indicator message */}
            {isStuck && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-700 rounded-lg flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  You reported being stuck on this step. <strong>{step.expert}</strong> has
                  been notified and will help soon.
                </p>
              </div>
            )}

            {/* Action Bar */}
            <ActionBar
              step={step}
              onStatusChange={onStatusChange}
              onSuggestEdit={onSuggestEdit}
              onReportStuck={onReportStuck}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
