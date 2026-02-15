/**
 * UsersPanel Component - Manager interface for user administration
 * Displays user list with onboarding status, allows creation, editing, and deletion of users
 * Includes activity logging for all user management operations
 */

import { useState, useMemo } from 'react';
import { Users, Edit2, Trash2, Plus } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useRoles, useOnboardingInstances } from '../../hooks';
import { useAuth } from '../../config/authContext';
import { UserModal } from '../modals';
import { DeleteConfirmationDialog } from '../ui';
import { logActivity } from '../../services/supabase';
import type { User, UserFormData, OnboardingInstance } from '../../types';

/**
 * Renders the user management panel for managers
 * Displays list of users with CRUD operations and onboarding status
 * Logs all operations to activity feed
 * Gets the current user ID from useAuth() for audit logging
 */
export function UsersPanel() {
  const { user } = useAuth();
  const userId = user?.uid ?? 'unknown';
  const { users, isLoading, error: hookError, createNewUser, editUser, removeUser, reset } = useUsers();
  const { roles, isLoading: rolesLoading } = useRoles();
  const { data: instances, isLoading: instancesLoading } = useOnboardingInstances();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'onboarding'>('all');

  // Build lookup map: lowercase email -> OnboardingInstance[]
  const instancesByEmail = useMemo(() => {
    const map = new Map<string, OnboardingInstance[]>();
    for (const inst of instances) {
      const email = inst.employeeEmail.toLowerCase();
      const existing = map.get(email) || [];
      existing.push(inst);
      map.set(email, existing);
    }
    return map;
  }, [instances]);

  const handleOpenCreateModal = () => {
    setSubmitError(null);
    setSuccessMessage(null);
    reset();
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSubmitError(null);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setSubmitError(null);
    setSuccessMessage(null);
    reset();
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setSubmitError(null);
  };

  const handleCreateUser = async (data: UserFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newUser = await createNewUser(data, userId);

      // Log activity
      try {
        await logActivity({
          userInitials: userId.slice(0, 2).toUpperCase(),
          action: `Created user: ${data.name} (${data.email})`,
          timeAgo: 'just now',
          userId,
          resourceType: 'user',
          resourceId: newUser.id,
        });
      } catch (logErr) {
        console.warn('Failed to log activity:', logErr);
      }

      setSuccessMessage(`User ${data.name} created successfully`);
      handleCloseCreateModal();

      // Clear success message after delay
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (data: UserFormData) => {
    if (!editingUser) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await editUser(editingUser.id, data);

      // Log activity
      try {
        await logActivity({
          userInitials: userId.slice(0, 2).toUpperCase(),
          action: `Updated user: ${data.name || editingUser.name}`,
          timeAgo: 'just now',
          userId,
          resourceType: 'user',
          resourceId: editingUser.id,
        });
      } catch (logErr) {
        console.warn('Failed to log activity:', logErr);
      }

      setSuccessMessage(`User ${data.name || editingUser.name} updated successfully`);
      handleCloseEditModal();

      // Clear success message after delay
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    const targetUser = userToDelete;
    setUserToDelete(null);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await removeUser(targetUser.id);

      // Log activity
      try {
        await logActivity({
          userInitials: userId.slice(0, 2).toUpperCase(),
          action: `Deleted user: ${targetUser.name} (${targetUser.email})`,
          timeAgo: 'just now',
          userId,
          resourceType: 'user',
          resourceId: targetUser.id,
        });
      } catch (logErr) {
        console.warn('Failed to log activity:', logErr);
      }

      setSuccessMessage(`User ${targetUser.name} deleted successfully`);

      // Clear success message after delay
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Separate users by role
  const allEmployeeUsers = users.filter(u => u.roles.includes('employee') && !u.roles.some(r => ['manager', 'admin'].includes(r)));
  const adminUsers = users.filter(u => u.roles.some(r => ['manager', 'admin'].includes(r)));

  // Count employees with active onboarding
  const onboardingEmployeeCount = allEmployeeUsers.filter(u => {
    const userInstances = instancesByEmail.get(u.email.toLowerCase()) || [];
    return userInstances.some(inst => inst.status === 'active');
  }).length;

  // Apply filter to employee list
  const employeeUsers = filter === 'onboarding'
    ? allEmployeeUsers.filter(u => {
        const userInstances = instancesByEmail.get(u.email.toLowerCase()) || [];
        return userInstances.some(inst => inst.status === 'active');
      })
    : allEmployeeUsers;

  // Build delete confirmation message
  const getDeleteMessage = (targetUser: User): string => {
    const userInstances = instancesByEmail.get(targetUser.email.toLowerCase()) || [];
    if (userInstances.length > 0) {
      const count = userInstances.length;
      return `Are you sure you want to delete ${targetUser.name}? This will also permanently delete their onboarding data (${count} onboarding instance${count !== 1 ? 's' : ''} and all associated steps). This action cannot be undone.`;
    }
    return `Are you sure you want to delete ${targetUser.name}? This action cannot be undone.`;
  };

  // Status badge colors
  const getStatusBadgeClasses = (status: string): string => {
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
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      default: return status;
    }
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString();
  };

  const renderEmployeeTable = (tableUsers: User[]) => (
    <div>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {tableUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {filter === 'onboarding' ? 'No employees currently onboarding' : 'No employees'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filter === 'onboarding'
                ? 'No employees have active onboarding instances'
                : 'No employee users yet'}
            </p>
          </div>
        ) : (
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
                    Roles
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
                {tableUsers.map((u) => {
                  const userInstances = instancesByEmail.get(u.email.toLowerCase()) || [];
                  // Show most recent / active instance
                  const primaryInstance = userInstances.find(i => i.status === 'active') || userInstances[0];

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-50">{u.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600 dark:text-slate-300 text-xs font-mono">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex px-2 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded text-xs font-medium"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {instancesLoading ? (
                          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
                        ) : primaryInstance ? (
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClasses(primaryInstance.status)}`}>
                            {getStatusLabel(primaryInstance.status)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {instancesLoading ? (
                          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
                        ) : primaryInstance ? (
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {primaryInstance.progress}%
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {instancesLoading ? (
                          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
                        ) : primaryInstance ? (
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(primaryInstance.startDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Edit user ${u.name}`}
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Delete user ${u.name}`}
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminTable = (tableUsers: User[]) => (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Administrators & Managers</h3>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {tableUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">No administrators & managers</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              No admin/manager users yet
            </p>
          </div>
        ) : (
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
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Profiles
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {tableUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-50">{u.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 dark:text-slate-300 text-xs font-mono">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex px-2 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded text-xs font-medium"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.profiles && u.profiles.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {u.profiles.map((profile) => (
                            <span
                              key={profile}
                              className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs"
                            >
                              {profile}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 text-xs italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Edit user ${u.name}`}
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Delete user ${u.name}`}
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <strong>Tip:</strong> Use "New User" to add managers, admins, or contractors. Use "New Hire" on the Dashboard
          to onboard employees with guided onboarding steps.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg">
            <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">User Administration</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage system users, assign roles and profiles
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 dark:bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 dark:hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add a system user (manager, admin, contractor). Use New Hire on the Dashboard to onboard employees."
          title="Add a manager, admin, or contractor. For onboarding employees, use 'New Hire' on the Dashboard."
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{submitError}</p>
        </div>
      )}

      {/* Hook Error */}
      {hookError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{hookError}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-600 dark:border-brand-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Loading users...</span>
          </div>
        </div>
      )}

      {/* Users Tables */}
      {!isLoading && users.length > 0 && (
        <div className="space-y-8">
          {/* Employee Section with Filter Toggle */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Employees</h3>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden" role="group" aria-label="Employee filter">
                <button
                  onClick={() => setFilter('all')}
                  aria-pressed={filter === 'all'}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  All Employees
                </button>
                <button
                  onClick={() => setFilter('onboarding')}
                  aria-pressed={filter === 'onboarding'}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200 dark:border-slate-600 ${
                    filter === 'onboarding'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Currently Onboarding ({onboardingEmployeeCount})
                </button>
              </div>
            </div>
            {renderEmployeeTable(employeeUsers)}
          </div>

          {renderAdminTable(adminUsers)}
        </div>
      )}

      {/* No Users at All */}
      {!isLoading && users.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">No users yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create your first user to get started
          </p>
        </div>
      )}

      {/* Create Modal */}
      <UserModal
        mode="create"
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateUser}
        isSubmitting={isSubmitting}
        error={submitError}
        roles={roles}
        rolesLoading={rolesLoading}
      />

      {/* Edit Modal */}
      <UserModal
        mode="edit"
        isOpen={showEditModal}
        user={editingUser}
        onClose={handleCloseEditModal}
        onSubmit={handleEditUser}
        isSubmitting={isSubmitting}
        error={submitError}
        roles={roles}
        rolesLoading={rolesLoading}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!userToDelete}
        title="Delete User"
        message={userToDelete ? getDeleteMessage(userToDelete) : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
        isLoading={isSubmitting}
      />
    </div>
  );
}
