/**
 * NewHiresPanel Component - View of employees going through onboarding with delete actions
 * Displays onboarding instances in a table with status filter, progress bars, status badges,
 * and per-row delete actions with confirmation dialog.
 * Self-contained: uses useOnboardingInstances() directly, no props needed
 */

import { useState, useMemo } from 'react';
import { Users, Trash2, Pencil } from 'lucide-react';
import { useOnboardingInstances, useRoles, useTemplates, useUsers } from '../../hooks';
import { useAuth } from '../../config/authContext';
import { logActivity, createOnboardingRunFromTemplate } from '../../services/supabase';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { ProgressBar } from '../ui/ProgressBar';
import { DeleteConfirmationDialog } from '../ui/DeleteConfirmationDialog';
import { getInitials } from '../../utils/formatters';
import { EditHireModal } from '../modals/EditHireModal';
import { AssignRoleModal } from '../modals/AssignRoleModal';
import { UnassignedUsersSection } from './UnassignedUsersSection';
import type { OnboardingInstance, User } from '../../types';

type StatusFilter = 'all' | 'active' | 'completed' | 'on_hold';

/** Returns Tailwind classes for status badge colors */
function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    case 'completed':
      return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
    case 'on_hold':
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
    default:
      return 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
  }
}

/** Returns human-readable label for a status value */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    case 'on_hold':
      return 'On Hold';
    default:
      return status;
  }
}

/** Formats a Unix timestamp to a locale date string, or returns a dash */
function formatDate(timestamp?: number): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString();
}

/** Returns an empty-state message appropriate for the current filter */
function getEmptyMessage(filter: StatusFilter): string {
  switch (filter) {
    case 'active':
      return 'No active new hires';
    case 'completed':
      return 'No completed new hires';
    case 'on_hold':
      return 'No on-hold new hires';
    default:
      return 'No new hires';
  }
}

/**
 * Renders a read-only table of onboarding instances for managers.
 * Includes a four-option status filter (All / Active / Completed / On Hold).
 */
export function NewHiresPanel() {
  const { data, isLoading, error, removeInstance, updateInstance } = useOnboardingInstances();
  const { user: authUser } = useAuth();
  const { roles, isLoading: rolesLoading } = useRoles();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [instanceToDelete, setInstanceToDelete] = useState<OnboardingInstance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingInstance, setEditingInstance] = useState<OnboardingInstance | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Unassigned users state
  const { users } = useUsers();
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);


  /** Show a success toast that auto-dismisses after 3 seconds */
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /** Handle assigning a role + template to an unassigned user */
  const handleAssignSubmit = async (
    userToAssign: User,
    assignRole: string,
    assignDepartment: string,
    assignTemplateId: string,
  ) => {
    setIsAssigning(true);
    setAssignError(null);
    try {
      // Step 1: Set access-control role to 'employee' via Zustand store
      // Uses _editUser which updates user_roles in DB + optimistically updates the store
      // (removes user from "Unassigned" list immediately)
      await useOnboardingStore.getState()._editUser(userToAssign.id, { roles: ['employee'] });

      // Step 2: Create onboarding instance from template and add to store
      const newInstance = await createOnboardingRunFromTemplate({
        employeeName: userToAssign.name,
        employeeEmail: userToAssign.email,
        role: assignRole,
        department: assignDepartment,
        templateId: assignTemplateId,
      });
      // Add new instance to store for immediate UI update in New Hires table
      useOnboardingStore.getState()._addInstance(newInstance);

      // Fire-and-forget activity log
      logActivity({
        userInitials: authUser ? getInitials(authUser.email ?? '') : 'SY',
        action: `Assigned ${assignRole} role to ${userToAssign.name}`,
        timeAgo: 'just now',
        userId: authUser?.uid,
      }).catch(() => {});

      showSuccess(`Role assigned to ${userToAssign.name} successfully`);
      setAssigningUser(null);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setIsAssigning(false);
    }
  };

  /** Handle confirming an instance deletion */
  const handleDeleteConfirm = async () => {
    if (!instanceToDelete) return;
    setIsDeleting(true);
    try {
      await removeInstance(instanceToDelete.id);
      // Fire-and-forget activity log
      logActivity({
        userInitials: authUser ? getInitials(authUser.email ?? '') : 'SY',
        action: `Deleted onboarding for ${instanceToDelete.employeeName}`,
        timeAgo: 'just now',
        userId: authUser?.uid,
      }).catch(() => {});
      showSuccess('Onboarding instance deleted successfully');
      setInstanceToDelete(null);
    } catch (err) {
      // Error is handled by the store; just close the dialog
      setInstanceToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  /** Handle submitting an edit for an onboarding instance */
  const handleEditSubmit = async (instanceId: string, updates: Partial<OnboardingInstance>) => {
    setIsEditing(true);
    setEditError(null);
    try {
      await updateInstance(instanceId, updates);
      // Fire-and-forget activity log
      logActivity({
        userInitials: authUser ? getInitials(authUser.email ?? '') : 'SY',
        action: `Edited onboarding for ${editingInstance?.employeeName ?? 'employee'}`,
        timeAgo: 'just now',
        userId: authUser?.uid,
      }).catch(() => {});
      showSuccess('Onboarding instance updated successfully');
      setEditingInstance(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update onboarding instance');
    } finally {
      setIsEditing(false);
    }
  };

  const filteredInstances = useMemo(
    () => (filter === 'all' ? data : data.filter((inst) => inst.status === filter)),
    [data, filter],
  );

  const statusCounts = useMemo(() => {
    const counts = { all: data.length, active: 0, completed: 0, on_hold: 0 };
    for (const inst of data) {
      if (inst.status === 'active') counts.active++;
      else if (inst.status === 'completed') counts.completed++;
      else if (inst.status === 'on_hold') counts.on_hold++;
    }
    return counts;
  }, [data]);

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'on_hold', label: 'On Hold' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg">
          <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">New Hires</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Employees currently going through onboarding
          </p>
        </div>
      </div>

      {/* Unassigned Users Section */}
      <UnassignedUsersSection
        users={users}
        onAssign={(user) => {
          setAssigningUser(user);
          setAssignError(null);
        }}
      />

      {/* Filter Toggle Group */}
      <div
        className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden w-fit"
        role="group"
        aria-label="Status filter"
      >
        {filterButtons.map(({ key, label }, idx) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              idx > 0 ? 'border-l border-slate-200 dark:border-slate-600' : ''
            } ${
              filter === key
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {label} ({statusCounts[key]})
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-600 dark:border-brand-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Loading onboarding data...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{error.message}</p>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {successMessage}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredInstances.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {getEmptyMessage(filter)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filter === 'all'
              ? 'No onboarding instances have been created yet'
              : 'Try changing the filter to see other statuses'}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && filteredInstances.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {filteredInstances.map((instance) => (
                  <tr
                    key={instance.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-50">
                        {instance.employeeName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 dark:text-slate-300 text-xs font-mono">
                        {instance.employeeEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300">
                        {instance.department}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded text-xs font-medium">
                        {instance.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClasses(instance.status)}`}
                      >
                        {getStatusLabel(instance.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ProgressBar
                        value={instance.progress}
                        showPercentage={true}
                        className="w-24"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(instance.startDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingInstance(instance)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-label={`Edit onboarding for ${instance.employeeName}`}
                          title="Edit onboarding instance"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => setInstanceToDelete(instance)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label={`Delete onboarding for ${instance.employeeName}`}
                          title="Delete onboarding instance"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={instanceToDelete !== null}
        title="Delete Onboarding Instance"
        message={
          instanceToDelete
            ? `Are you sure you want to delete the onboarding for "${instanceToDelete.employeeName}"? This will remove all associated steps and data. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setInstanceToDelete(null)}
        isLoading={isDeleting}
        isDangerous
      />

      {/* Edit Hire Modal */}
      <EditHireModal
        isOpen={editingInstance !== null}
        onClose={() => {
          setEditingInstance(null);
          setEditError(null);
        }}
        onSubmit={handleEditSubmit}
        instance={editingInstance}
        isSubmitting={isEditing}
        error={editError}
        roles={roles}
        rolesLoading={rolesLoading}
        templates={templates}
        templatesLoading={templatesLoading}
      />

      {/* Assign Role Modal */}
      <AssignRoleModal
        isOpen={assigningUser !== null}
        onClose={() => {
          setAssigningUser(null);
          setAssignError(null);
        }}
        onSubmit={handleAssignSubmit}
        user={assigningUser}
        isSubmitting={isAssigning}
        error={assignError}
        roles={roles}
        rolesLoading={rolesLoading}
        templates={templates}
        templatesLoading={templatesLoading}
      />
    </div>
  );
}
