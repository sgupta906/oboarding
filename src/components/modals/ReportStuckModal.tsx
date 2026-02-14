/**
 * ReportStuckModal Component - Modal for reporting blocked steps
 * Allows employees to notify subject matter experts when they're stuck
 * Includes confirmation flow and accessibility features
 */

import { AlertTriangle, Clock, Bell } from 'lucide-react';
import { ModalWrapper } from '../ui';
import type { ReportStuckModalProps } from '../../types';

/**
 * Renders a modal for reporting a step blocker
 * Shows confirmation details and estimated response time
 * @param step - The step the employee is stuck on
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback to close the modal
 * @param onSubmit - Callback when confirming the stuck status
 * @param isSubmitting - Whether the request is being processed
 */
export function ReportStuckModal({
  step,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ReportStuckModalProps) {
  const handleSubmit = () => {
    onSubmit();
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={onClose}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        aria-label="Cancel without reporting"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 ${
          isSubmitting
            ? 'text-white bg-rose-400 opacity-70 cursor-not-allowed'
            : 'text-white bg-rose-600 hover:bg-rose-700 active:scale-95'
        }`}
        aria-label={isSubmitting ? 'Notifying expert' : `Notify ${step.expert} that you are stuck`}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span>
            Notifying...
          </>
        ) : (
          <>
            <Bell size={16} />
            Notify Expert
          </>
        )}
      </button>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Report Blocker"
      onClose={onClose}
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertTriangle
            size={20}
            className="text-rose-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-rose-900">You're stuck on a step</p>
            <p className="text-sm text-rose-700 mt-1">
              We understand this can be frustrating. Let's get you the help you need.
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Step
            </p>
            <p className="text-sm font-medium text-slate-900 mt-1">{step.title}</p>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Expert Being Notified
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {step.expert.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{step.expert}</p>
                <p className="text-xs text-slate-600">Subject Matter Expert</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Clock
            size={16}
            className="text-blue-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-blue-700">
            <strong>{step.expert}</strong> will be notified immediately and will reach
            out to you within the next 2 hours.
          </p>
        </div>

        <p className="text-xs text-slate-600">
          By confirming, you acknowledge that you have reviewed the step content and are
          unable to proceed without expert assistance.
        </p>
      </div>
    </ModalWrapper>
  );
}
