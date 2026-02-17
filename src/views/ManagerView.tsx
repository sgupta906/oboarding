/**
 * ManagerView Component - Self-contained dashboard for onboarding managers/admins
 * Calls hooks directly (useSuggestions, useActivities, useOnboardingInstances)
 * and owns all manager-specific state, computations, and handlers.
 *
 * Features: Real-time KPI calculations, approval/rejection of suggestions,
 * onboarding instance creation, and dynamic activity feed updates
 * Layout: Responsive design with max-w-7xl for better use of large screens,
 * asymmetric grid (2fr:1fr) to prioritize suggestions over activity feed
 */

import { useState, useMemo } from 'react';
import {
  ManagerDashboardHeader,
  KPISection,
  SuggestionsSection,
  ActivitySection,
  RoleManagementPanel,
  NewHiresPanel,
  UsersPanel,
} from '../components/manager';
import { CreateOnboardingModal, type OnboardingFormData } from '../components/modals';
import {
  useCreateOnboarding,
  useRoles,
  useTemplates,
  useSuggestions,
  useActivities,
  useOnboardingInstances,
} from '../hooks';
import { useToast } from '../context/ToastContext';
import {
  updateSuggestionStatus,
  deleteSuggestion,
  logActivity,
} from '../services/supabase';
import type { Step } from '../types';

/**
 * Renders the manager-facing dashboard.
 * Self-contained: all data comes from hooks, all handlers are internal.
 * Follows the same pattern as NewHiresPanel and UsersPanel.
 */
export function ManagerView() {
  // ---------------------------------------------------------------------------
  // Hooks: data subscriptions
  // ---------------------------------------------------------------------------
  const {
    data: suggestions,
    isLoading: suggestionsLoading,
    optimisticUpdateStatus,
    optimisticRemove,
    rollback,
  } = useSuggestions();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: onboardingInstances, isLoading: instancesLoading } = useOnboardingInstances();
  const { showToast } = useToast();

  // ---------------------------------------------------------------------------
  // Hooks: existing (create onboarding, roles, templates)
  // ---------------------------------------------------------------------------
  const { mutate: createOnboarding, isLoading: isCreating, error: creationError, reset: resetError } = useCreateOnboarding();
  const { roles, isLoading: rolesLoading } = useRoles();
  const { data: templates, isLoading: templatesLoading } = useTemplates();

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [isCreateOnboardingOpen, setIsCreateOnboardingOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roles' | 'new-hires' | 'users'>('dashboard');
  const [loadingSuggestionIds, setLoadingSuggestionIds] = useState<Set<number | string>>(new Set());

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const managerSteps = useMemo<Step[]>(
    () => onboardingInstances.flatMap((instance) => instance.steps),
    [onboardingInstances]
  );

  const stuckEmployeeNames = useMemo(
    () =>
      onboardingInstances
        .filter((instance) => instance.steps.some((step) => step.status === 'stuck'))
        .map((instance) => instance.employeeName),
    [onboardingInstances]
  );

  const isDashboardLoading = suggestionsLoading || activitiesLoading || instancesLoading;

  /**
   * Resolve a step title from instanceId + stepId.
   * Prefers instance-scoped lookup; falls back to flat managerSteps.
   */
  const resolveStepTitle = (stepId?: number, instanceId?: string): string => {
    if (stepId === undefined) return 'Unknown Step';
    if (instanceId) {
      const instance = onboardingInstances.find((i) => i.id === instanceId);
      if (instance) {
        const step = instance.steps.find((s) => s.id === stepId);
        if (step) return step.title;
      }
    }
    return managerSteps.find((s) => s.id === stepId)?.title || `Step ${stepId}`;
  };

  // ---------------------------------------------------------------------------
  // Handlers: suggestion approve/reject (optimistic update pattern)
  // ---------------------------------------------------------------------------
  const handleApproveSuggestion = async (suggestionId: number | string) => {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    const stepTitle = resolveStepTitle(suggestion?.stepId, suggestion?.instanceId);
    const employeeName = suggestion?.user || 'Unknown';

    setLoadingSuggestionIds((prev) => new Set(prev).add(suggestionId));
    const snapshot = optimisticUpdateStatus(suggestionId, 'reviewed');
    try {
      await updateSuggestionStatus(String(suggestionId), 'reviewed');
      logActivity({
        userInitials: 'MG',
        action: `approved suggestion from ${employeeName} on "${stepTitle}"`,
        timeAgo: 'just now',
      }).catch(console.warn);
    } catch {
      rollback(snapshot);
      showToast('Failed to approve suggestion. Please try again.', 'error');
    } finally {
      setLoadingSuggestionIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    }
  };

  const handleRejectSuggestion = async (suggestionId: number | string) => {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    const stepTitle = resolveStepTitle(suggestion?.stepId, suggestion?.instanceId);
    const employeeName = suggestion?.user || 'Unknown';

    setLoadingSuggestionIds((prev) => new Set(prev).add(suggestionId));
    const snapshot = optimisticRemove(suggestionId);
    try {
      await deleteSuggestion(String(suggestionId));
      logActivity({
        userInitials: 'MG',
        action: `rejected suggestion from ${employeeName} on "${stepTitle}"`,
        timeAgo: 'just now',
      }).catch(console.warn);
    } catch {
      rollback(snapshot);
      showToast('Failed to reject suggestion. Please try again.', 'error');
    } finally {
      setLoadingSuggestionIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: create onboarding
  // ---------------------------------------------------------------------------
  const handleOpenCreateOnboarding = () => {
    resetError();
    setSuccessMessage(null);
    setIsCreateOnboardingOpen(true);
  };

  const handleCloseCreateOnboarding = () => {
    setIsCreateOnboardingOpen(false);
    resetError();
    setSuccessMessage(null);
  };

  const handleSubmitOnboarding = async (formData: OnboardingFormData) => {
    try {
      await createOnboarding(formData);

      // Show success message
      setSuccessMessage(`Onboarding created for ${formData.employeeName}`);

      // Close modal after success
      setTimeout(() => {
        handleCloseCreateOnboarding();
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      // Error state is managed by the hook and displayed in the modal
      // No need to close the modal on error
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header with title and action button - Full width */}
      <ManagerDashboardHeader onNewHireClick={handleOpenCreateOnboarding} />

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label="Show dashboard view"
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label="Show roles management view"
          aria-current={activeTab === 'roles' ? 'page' : undefined}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab('new-hires')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'new-hires'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label="Show new hires view"
          aria-current={activeTab === 'new-hires' ? 'page' : undefined}
        >
          New Hires
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label="Show users management view"
          aria-current={activeTab === 'users' ? 'page' : undefined}
        >
          Users
        </button>
      </div>

      {/* Success Toast Message */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      {/* Dashboard Tab Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* KPI Cards - Full width, real-time calculations */}
          <KPISection
            steps={managerSteps}
            suggestions={suggestions}
            stuckEmployeeNames={stuckEmployeeNames}
            onboardingInstances={onboardingInstances}
          />

          {/* Suggestions and Activity Grid - Asymmetric layout (2fr:1fr)
              Prioritizes suggestions/feedback on wider left column,
              activity feed in narrower right column.
              Stacks vertically on mobile (grid-cols-1) and tablet (lg: breakpoint)
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
            {/* Documentation Feedback Section - Primary (2fr) */}
            <SuggestionsSection
              suggestions={suggestions}
              steps={managerSteps}
              onApprove={handleApproveSuggestion}
              onReject={handleRejectSuggestion}
              loadingSuggestionIds={loadingSuggestionIds}
              onboardingInstances={onboardingInstances}
            />

            {/* Live Activity Section - Secondary (1fr) */}
            <ActivitySection activities={activities} />
          </div>
        </>
      )}

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <RoleManagementPanel />
        </div>
      )}

      {/* New Hires Tab Content */}
      {activeTab === 'new-hires' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <NewHiresPanel />
        </div>
      )}

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <UsersPanel />
        </div>
      )}

      {/* Create Onboarding Modal */}
      <CreateOnboardingModal
        isOpen={isCreateOnboardingOpen}
        onClose={handleCloseCreateOnboarding}
        onSubmit={handleSubmitOnboarding}
        isSubmitting={isCreating}
        error={creationError}
        roles={roles}
        rolesLoading={rolesLoading}
        templates={templates}
        templatesLoading={templatesLoading}
      />
    </div>
  );
}
