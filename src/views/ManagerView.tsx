/**
 * ManagerView Component - Dashboard for onboarding managers/admins
 * Displays KPIs, documentation feedback, and live activity
 * Features: Real-time KPI calculations, approval/rejection of suggestions,
 * onboarding instance creation, and dynamic activity feed updates
 * Layout: Responsive design with max-w-7xl for better use of large screens,
 * asymmetric grid (2fr:1fr) to prioritize suggestions over activity feed
 */

import { useState } from 'react';
import {
  ManagerDashboardHeader,
  KPISection,
  SuggestionsSection,
  ActivitySection,
  RoleManagementPanel,
  UsersPanel,
} from '../components/manager';
import { CreateOnboardingModal, type OnboardingFormData } from '../components/modals';
import { useCreateOnboarding, useRoles, useTemplates } from '../hooks';
import type { Step, Suggestion, Activity, OnboardingInstance } from '../types';

interface ManagerViewProps {
  steps: Step[];
  suggestions: Suggestion[];
  activities?: Activity[];
  stuckEmployeeNames?: string[];
  onboardingInstances?: OnboardingInstance[];
  onApproveSuggestion?: (id: number | string) => void;
  onRejectSuggestion?: (id: number | string) => void;
  onOnboardingCreated?: (employeeName: string) => void;
  onRefreshInstances?: () => void;
}

/**
 * Renders the manager-facing dashboard
 * Shows KPIs, documentation feedback section, and activity feed
 * All metrics update in real-time as employee actions occur
 * Information hierarchy: KPIs (full width) > Suggestions (2fr) > Activity (1fr)
 * @param steps - Array of all onboarding steps
 * @param suggestions - Array of submitted suggestions
 * @param activities - Array of recent activities from employees
 * @param stuckEmployeeNames - Names of employees currently stuck
 * @param onboardingInstances - Array of onboarding instances for KPI calculations
 * @param onApproveSuggestion - Callback to approve a suggestion
 * @param onRejectSuggestion - Callback to reject a suggestion
 * @param onOnboardingCreated - Callback when onboarding instance is created successfully
 * @param onRefreshInstances - Callback to refresh onboarding instances list
 */
export function ManagerView({
  steps,
  suggestions,
  activities = [],
  stuckEmployeeNames = [],
  onboardingInstances = [],
  onApproveSuggestion,
  onRejectSuggestion,
  onOnboardingCreated,
  onRefreshInstances,
}: ManagerViewProps) {
  const [isCreateOnboardingOpen, setIsCreateOnboardingOpen] = useState(false);
  const { mutate: createOnboarding, isLoading: isCreating, error: creationError, reset: resetError } = useCreateOnboarding();
  const { roles, isLoading: rolesLoading } = useRoles();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roles' | 'users'>('dashboard');

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

      // Call callbacks
      if (onOnboardingCreated) {
        onOnboardingCreated(formData.employeeName);
      }

      if (onRefreshInstances) {
        onRefreshInstances();
      }

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
            steps={steps}
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
              steps={steps}
              onApprove={onApproveSuggestion}
              onReject={onRejectSuggestion}
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
