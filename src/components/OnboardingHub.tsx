/**
 * OnboardingHub Component - Main application container
 * Now backed by real Firestore data via custom hooks and services.
 *
 * Performance Optimizations:
 * - Conditional hook loading: Manager-only hooks are only loaded when user is a manager
 * - Loading states with timeout fallbacks prevent infinite loading
 * - React.memo on expensive child components
 */

import { useMemo, useState, memo } from 'react';
import { EmployeeView, ManagerView } from '../views';
import { SuggestEditModal, ReportStuckModal } from '../components/modals';
import { EmployeeSelector } from './onboarding';
import { useAuth } from '../config/authContext';
import {
  useEmployeeOnboarding,
  useSteps,
  useManagerData,
} from '../hooks';
import {
  createSuggestion,
  deleteSuggestion,
  logActivity,
  updateStepStatus,
  updateSuggestionStatus,
} from '../services/supabase';
import type { Step, StepStatus, ModalState } from '../types';

interface OnboardingHubProps {
  currentView?: 'employee' | 'manager';
  onViewChange?: (view: 'employee' | 'manager') => void;
}

// Memoized ManagerView to prevent unnecessary re-renders
const MemoizedManagerView = memo(ManagerView);
const MemoizedEmployeeView = memo(EmployeeView);

export function OnboardingHub({ currentView = 'employee' }: OnboardingHubProps) {
  const { user, role } = useAuth();
  const isManager = role === 'manager' || role === 'admin';

  // Employee-specific data (only load for employees OR when manager views employee tab)
  const employeeEmail = !isManager ? user?.email ?? null : null;
  const {
    instance: employeeInstance,
    isLoading: employeeInstanceLoading,
  } = useEmployeeOnboarding(employeeEmail);
  const { data: employeeStepsData, isLoading: employeeStepsLoading } = useSteps(
    employeeInstance?.id ?? ''
  );

  const shouldLoadDashboardData = isManager && currentView === 'manager';
  const {
    suggestions,
    activities,
    onboardingInstances,
    isDashboardLoading,
    areInstancesLoading,
  } = useManagerData({
    enableDashboardData: shouldLoadDashboardData,
    enableInstances: isManager,
  });

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

  const managerSteps = useMemo<Step[]>(() => {
    if (!isManager) return [];
    return onboardingInstances.flatMap((instance) => instance.steps);
  }, [isManager, onboardingInstances]);

  const stuckEmployeeNames = useMemo(() => {
    if (!isManager) return [];
    return onboardingInstances
      .filter((instance) => instance.steps.some((step) => step.status === 'stuck'))
      .map((instance) => instance.employeeName);
  }, [isManager, onboardingInstances]);

  const handleStatusChange = async (id: number, newStatus: StepStatus) => {
    if (!employeeInstance?.id) return;
    try {
      await updateStepStatus(employeeInstance.id, id, newStatus);
      await logActivity({
        userInitials: employeeInstance.employeeName.slice(0, 2).toUpperCase(),
        action:
          newStatus === 'completed'
            ? `completed step ${id}`
            : newStatus === 'stuck'
              ? `reported stuck on step ${id}`
              : `marked step ${id} as pending`,
        timeAgo: 'just now',
      });
    } catch (error) {
      console.error('Failed to update step status', error);
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
      await logActivity({
        userInitials: employeeInstance.employeeName.slice(0, 2).toUpperCase(),
        action: `submitted suggestion for step ${activeModal.stepId}`,
        timeAgo: 'just now',
      });
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to submit suggestion', error);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleReportStuck = async () => {
    if (!activeModal || !employeeInstance) return;
    setIsSubmittingModal(true);
    try {
      await updateStepStatus(employeeInstance.id, activeModal.stepId, 'stuck');
      await logActivity({
        userInitials: employeeInstance.employeeName.slice(0, 2).toUpperCase(),
        action: `reported stuck on step ${activeModal.stepId}`,
        timeAgo: 'just now',
      });
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to mark step as stuck', error);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleApproveSuggestion = async (suggestionId: number | string) => {
    try {
      await updateSuggestionStatus(String(suggestionId), 'reviewed');
      await logActivity({
        userInitials: 'MG',
        action: 'approved a documentation suggestion',
        timeAgo: 'just now',
      });
    } catch (error) {
      console.error('Failed to approve suggestion', error);
    }
  };

  const handleRejectSuggestion = async (suggestionId: number | string) => {
    try {
      await deleteSuggestion(String(suggestionId));
      await logActivity({
        userInitials: 'MG',
        action: 'rejected a documentation suggestion',
        timeAgo: 'just now',
      });
    } catch (error) {
      console.error('Failed to reject suggestion', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">No onboarding run assigned to your email yet.</p>
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
        />
      )}

      {/* Manager Dashboard - only when manager is viewing manager tab */}
      {isManager && currentView === 'manager' && !isDashboardLoading && (
        <MemoizedManagerView
          steps={managerSteps}
          suggestions={suggestions}
          activities={activities}
          stuckEmployeeNames={stuckEmployeeNames}
          onboardingInstances={onboardingInstances}
          onApproveSuggestion={handleApproveSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
        />
      )}

      {/* Loading state for manager view */}
      {isManager && currentView === 'manager' && isDashboardLoading && (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
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
