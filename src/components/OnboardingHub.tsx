/**
 * OnboardingHub Component - Main application container (thin router)
 * Orchestrates view switching between employee and manager dashboards.
 * Employee data management lives here; manager data is self-contained in ManagerView.
 *
 * Performance Optimizations:
 * - Conditional hook loading: Employee hooks only loaded for employees
 * - React.memo on EmployeeView to prevent unnecessary re-renders
 */

import { useMemo, useState, memo } from 'react';
import { User, LogOut } from 'lucide-react';
import { EmployeeView, ManagerView } from '../views';
import { SuggestEditModal, ReportStuckModal } from '../components/modals';
import { EmployeeSelector } from './onboarding';
import { useAuth } from '../config/authContext';
import { useToast } from '../context/ToastContext';
import {
  useEmployeeOnboarding,
  useSteps,
  useOnboardingInstances,
} from '../hooks';
import {
  createSuggestion,
  logActivity,
} from '../services/supabase';
import type { StepStatus, ModalState } from '../types';

interface OnboardingHubProps {
  currentView?: 'employee' | 'manager';
  onViewChange?: (view: 'employee' | 'manager') => void;
}

const MemoizedEmployeeView = memo(EmployeeView);

export function OnboardingHub({ currentView = 'employee' }: OnboardingHubProps) {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const isManager = role === 'manager' || role === 'admin';

  // Employee-specific data (only load for employees OR when manager views employee tab)
  const employeeEmail = !isManager ? user?.email ?? null : null;
  const {
    instance: employeeInstance,
    isLoading: employeeInstanceLoading,
  } = useEmployeeOnboarding(employeeEmail);
  const { data: employeeStepsData, isLoading: employeeStepsLoading, updateStatus } = useSteps(
    employeeInstance?.id ?? ''
  );

  // Onboarding instances for EmployeeSelector (manager viewing employee tab)
  const { data: onboardingInstances, isLoading: areInstancesLoading } = useOnboardingInstances(isManager);

  // State for viewing other employees' onboarding (manager feature)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // Get the selected instance for manager viewing employee onboarding
  const selectedInstance = useMemo(() => {
    if (!isManager || currentView !== 'employee' || !selectedInstanceId) return null;
    return onboardingInstances.find(inst => inst.id === selectedInstanceId) || null;
  }, [isManager, currentView, selectedInstanceId, onboardingInstances]);

  // Load steps for selected instance (when manager views specific employee)
  const { data: selectedInstanceSteps } = useSteps(
    selectedInstance?.id ?? ''
  );

  const [activeModal, setActiveModal] = useState<ModalState | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Per-ID loading state tracking
  const [loadingStepIds, setLoadingStepIds] = useState<Set<number>>(new Set());

  const handleStatusChange = async (id: number, newStatus: StepStatus) => {
    if (!employeeInstance?.id) return;
    setLoadingStepIds((prev) => new Set(prev).add(id));
    try {
      await updateStatus(id, newStatus);
      logActivity({
        userInitials: employeeInstance.employeeName.slice(0, 2).toUpperCase(),
        action:
          newStatus === 'completed'
            ? `completed step ${id}`
            : newStatus === 'stuck'
              ? `reported stuck on step ${id}`
              : `marked step ${id} as pending`,
        timeAgo: 'just now',
      }).catch(console.warn);
    } catch {
      showToast('Failed to update step status. Please try again.', 'error');
    } finally {
      setLoadingStepIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSuggestEditOpen = (stepId: number) => {
    setActiveModal({ type: 'edit', stepId });
  };

  const handleReportStuckOpen = (stepId: number) => {
    setActiveModal({ type: 'stuck', stepId });
  };

  const handleSuggestEdit = async (text: string) => {
    if (!text.trim() || !activeModal || !employeeInstance) return;
    setIsSubmittingModal(true);
    try {
      await createSuggestion({
        stepId: activeModal.stepId,
        user: employeeInstance.employeeName,
        text: text.trim(),
        status: 'pending',
        instanceId: employeeInstance.id,
      });
      logActivity({
        userInitials: employeeInstance.employeeName.slice(0, 2).toUpperCase(),
        action: `submitted suggestion for step ${activeModal.stepId}`,
        timeAgo: 'just now',
      }).catch(console.warn);
      setActiveModal(null);
    } catch {
      showToast('Failed to submit suggestion. Please try again.', 'error');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleReportStuck = async () => {
    if (!activeModal || !employeeInstance) return;
    setIsSubmittingModal(true);
    try {
      await updateStatus(activeModal.stepId, 'stuck');
      logActivity({
        userInitials: employeeInstance.employeeName.slice(0, 2).toUpperCase(),
        action: `reported stuck on step ${activeModal.stepId}`,
        timeAgo: 'just now',
      }).catch(console.warn);
      setActiveModal(null);
    } catch {
      showToast('Failed to mark step as stuck. Please try again.', 'error');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const currentStep = activeModal
    ? employeeStepsData.find((step) => step.id === activeModal.stepId)
    : null;

  const employeeLoadingState =
    !isManager && (employeeInstanceLoading || employeeStepsLoading);

  // For managers viewing employee view, determine steps and instance to show
  const viewingInstance = isManager && currentView === 'employee' && selectedInstance
    ? selectedInstance
    : employeeInstance;
  const viewingSteps = isManager && currentView === 'employee' && selectedInstance
    ? selectedInstanceSteps
    : employeeStepsData;

  if (!isManager && employeeLoadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading your onboarding...</p>
      </div>
    );
  }

  if (!isManager && !employeeInstance && !employeeInstanceLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="inline-flex justify-center items-center w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
            <User size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No onboarding assigned yet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your manager will set up your onboarding. Check back soon!
          </p>
          <button
            onClick={() => { window.location.hash = '#/sign-out'; }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Handler for manager to select an employee's onboarding
  const handleSelectEmployee = (instanceId: string | null) => {
    setSelectedInstanceId(instanceId);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Manager viewing employee onboarding - show selector */}
      {isManager && currentView === 'employee' && (
        <div className="mb-6">
          <EmployeeSelector
            instances={onboardingInstances}
            selectedId={selectedInstanceId}
            onSelect={handleSelectEmployee}
            isLoading={areInstancesLoading}
          />
        </div>
      )}

      {/* Employee view - for employees or for managers viewing a selected employee */}
      {(!isManager || currentView === 'employee') && viewingInstance && (
        <MemoizedEmployeeView
          steps={viewingSteps}
          employeeName={viewingInstance.employeeName}
          team={viewingInstance.department}
          onStatusChange={handleStatusChange}
          onSuggestEdit={handleSuggestEditOpen}
          onReportStuck={handleReportStuckOpen}
          loadingStepIds={loadingStepIds}
        />
      )}

      {/* Manager Dashboard - self-contained, no data props needed */}
      {isManager && currentView === 'manager' && (
        <ManagerView />
      )}

      {currentStep && employeeInstance && (
        <>
          <SuggestEditModal
            step={currentStep}
            isOpen={activeModal?.type === 'edit'}
            onClose={() => setActiveModal(null)}
            onSubmit={handleSuggestEdit}
            isSubmitting={isSubmittingModal}
          />

          <ReportStuckModal
            step={currentStep}
            isOpen={activeModal?.type === 'stuck'}
            onClose={() => setActiveModal(null)}
            onSubmit={handleReportStuck}
            isSubmitting={isSubmittingModal}
          />
        </>
      )}
    </main>
  );
}
