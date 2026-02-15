/**
 * UsersPanel Component - CRUD management panel for system users
 * Displays all users in a unified table with create, edit, and delete actions.
 * Uses UserModal for create/edit and DeleteConfirmationDialog for delete confirmation.
 * Self-contained: consumes useUsers() for data + CRUD, useRoles() for role selection,
 * and useAuth() for activity logging attribution.
 */

import { useState } from 'react';
import { UserCog, Plus, Edit2, Trash2 } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import { useAuth } from '../../config/authContext';
import { logActivity } from '../../services/supabase';
import { UserModal } from '../modals/UserModal';
import { DeleteConfirmationDialog } from '../ui/DeleteConfirmationDialog';
import type { User, UserFormData } from '../../types';

/**
 * Renders a CRUD management panel for system users (managers, admins, contractors).
 * Distinct from NewHiresPanel which shows onboarding instances (read-only).
 */
export function UsersPanel() {
  const { users, isLoading, error, createNewUser, editUser, removeUser } = useUsers();
  const { roles, isLoading: rolesLoading } = useRoles();
  const { user: authUser } = useAuth();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Operation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /** Helper to get initials for activity logging */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /** Show a success toast that auto-dismisses after 3 seconds */
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /** Handle creating a new user */
  const handleCreateSubmit = async (data: UserFormData) => {
    setModalError(null);
    setIsSubmitting(true);
    try {
      const currentUserId = authUser?.uid ?? 'unknown';
      await createNewUser(data, currentUserId);
      // Fire-and-forget activity log
      logActivity({
        userInitials: authUser ? getInitials(authUser.email ?? '') : 'SY',
        action: `Created user ${data.name}`,
        timeAgo: 'just now',
        userId: currentUserId,
      }).catch(() => {});
      showSuccess('User created successfully');
      setShowCreateModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Handle editing an existing user */
  const handleEditSubmit = async (data: UserFormData) => {
    if (!editingUser) return;
    setModalError(null);
    setIsSubmitting(true);
    try {
      await editUser(editingUser.id, data);
      // Fire-and-forget activity log
      const currentUserId = authUser?.uid ?? 'unknown';
      logActivity({
        userInitials: authUser ? getInitials(authUser.email ?? '') : 'SY',
        action: `Updated user ${data.name}`,
        timeAgo: 'just now',
        userId: currentUserId,
      }).catch(() => {});
      showSuccess('User updated successfully');
      setEditingUser(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Handle confirming a user deletion */
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await removeUser(userToDelete.id);
      // Fire-and-forget activity log
      const currentUserId = authUser?.uid ?? 'unknown';
      logActivity({
        userInitials: authUser ? getInitials(authUser.email ?? '') : 'SY',
        action: `Deleted user ${userToDelete.name}`,
        timeAgo: 'just now',
        userId: currentUserId,
      }).catch(() => {});
      showSuccess('User deleted successfully');
      setUserToDelete(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg">
            <UserCog className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Users</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage system users
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors w-full sm:w-auto justify-center sm:justify-start"
          aria-label="New User"
        >
          <Plus size={18} />
          <span>New User</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>New User</strong> creates a system account (manager/admin/contractor). To start
          an employee&apos;s onboarding journey, use <strong>New Hire</strong> on the Dashboard tab.
        </p>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {successMessage}
          </p>
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

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && users.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <UserCog className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">No users</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create your first system user to get started
          </p>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !error && users.length > 0 && (
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
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {u.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        {u.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex px-2 py-0.5 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded text-xs font-medium"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.profiles && u.profiles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.profiles.map((profile) => (
                            <span
                              key={profile}
                              className="inline-flex px-2 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-xs font-medium"
                            >
                              {profile}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setModalError(null);
                            setEditingUser(u);
                          }}
                          className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                          aria-label={`Edit user ${u.name}`}
                          title="Edit user"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label={`Delete user ${u.name}`}
                          title="Delete user"
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

      {/* Create Modal */}
      <UserModal
        mode="create"
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setModalError(null);
        }}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        error={modalError}
        roles={roles}
        rolesLoading={rolesLoading}
      />

      {/* Edit Modal */}
      <UserModal
        mode="edit"
        isOpen={editingUser !== null}
        onClose={() => {
          setEditingUser(null);
          setModalError(null);
        }}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        error={modalError}
        roles={roles}
        rolesLoading={rolesLoading}
        user={editingUser}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={userToDelete !== null}
        title="Delete User"
        message={
          userToDelete
            ? `Are you sure you want to delete "${userToDelete.name}"? This will also delete any associated onboarding data. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setUserToDelete(null)}
        isLoading={isDeleting}
        isDangerous
      />
    </div>
  );
}
