/**
 * UsersPanel Component - Manager interface for user administration
 * Displays user list, allows creation, editing, and deletion of users
 * Includes activity logging for all user management operations
 */

import { useState } from 'react';
import { Users, Edit2, Trash2, Plus } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { CreateUserModal, EditUserModal } from '../modals';
import { logActivity } from '../../services/userOperations';
import type { User, UserFormData } from '../../types';

interface UsersPanelProps {
  userId: string; // ID of the manager performing the action
}

/**
 * Renders the user management panel for managers
 * Displays list of users with CRUD operations
 * Logs all operations to activity feed
 * @param userId - ID of the manager performing actions (for audit logging)
 */
export function UsersPanel({ userId }: UsersPanelProps) {
  const { users, isLoading, error: hookError, createNewUser, editUser, removeUser, reset } = useUsers();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleEditUser = async (data: Partial<UserFormData>) => {
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

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await removeUser(user.id);

      // Log activity
      try {
        await logActivity({
          userInitials: userId.slice(0, 2).toUpperCase(),
          action: `Deleted user: ${user.name} (${user.email})`,
          timeAgo: 'just now',
          userId,
          resourceType: 'user',
          resourceId: user.id,
        });
      } catch (logErr) {
        console.warn('Failed to log activity:', logErr);
      }

      setSuccessMessage(`User ${user.name} deleted successfully`);

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
  const employeeUsers = users.filter(u => u.roles.includes('employee') && !u.roles.some(r => ['manager', 'admin'].includes(r)));
  const adminUsers = users.filter(u => u.roles.some(r => ['manager', 'admin'].includes(r)));

  const renderUserTable = (tableUsers: User[], title: string) => (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">{title}</h3>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {tableUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">No {title.toLowerCase()}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {title === 'Employees' ? 'No employee users yet' : 'No admin/manager users yet'}
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
                {tableUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-50">{user.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 dark:text-slate-300 text-xs font-mono">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.profiles && user.profiles.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {user.profiles.map((profile) => (
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
                          onClick={() => handleOpenEditModal(user)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Edit user ${user.name}`}
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Delete user ${user.name}`}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Create new user"
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
            <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Loading users...</span>
          </div>
        </div>
      )}

      {/* Users Tables */}
      {!isLoading && users.length > 0 && (
        <div className="space-y-8">
          {renderUserTable(employeeUsers, 'Employees')}
          {renderUserTable(adminUsers, 'Administrators & Managers')}
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
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateUser}
        isSubmitting={isSubmitting}
        error={submitError}
      />

      {/* Edit Modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={editingUser}
        onClose={handleCloseEditModal}
        onSubmit={handleEditUser}
        isSubmitting={isSubmitting}
        error={submitError}
      />
    </div>
  );
}
