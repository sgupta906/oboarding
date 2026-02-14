/**
 * RoleManagementPanel Component - Display and manage custom roles
 * Features: List roles in table view, search/filter, add/edit/delete actions,
 * empty states, loading states, error handling, and full a11y support
 * Responsive design: Stacks vertically on mobile, table layout on desktop
 */

import { useState, useMemo } from 'react';
import { Trash2, Edit2, Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useRoles } from '../../hooks';
import { useAuth } from '../../config/authContext';
import type { CustomRole } from '../../types';
import { CreateRoleModal } from '../modals/CreateRoleModal';
import { EditRoleModal } from '../modals/EditRoleModal';
import { DeleteConfirmationDialog } from '../ui/DeleteConfirmationDialog';

interface RoleManagementPanelProps {
  onRoleCreated?: (role: CustomRole) => void;
  onRoleUpdated?: (role: CustomRole) => void;
  onRoleDeleted?: (roleId: string) => void;
}

/**
 * Renders a comprehensive role management panel with CRUD operations
 * Handles loading, error, and empty states with proper accessibility
 * Supports search/filter, inline editing, and delete confirmation
 * @param userId - Current user ID for tracking role creation
 * @param onRoleCreated - Callback when role is created
 * @param onRoleUpdated - Callback when role is updated
 * @param onRoleDeleted - Callback when role is deleted
 */
export function RoleManagementPanel({
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
}: RoleManagementPanelProps) {
  const { user } = useAuth();
  const { roles, isLoading, error, createRole, updateRole, deleteRole, refetch } = useRoles(user?.uid);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<CustomRole | null>(null);

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    roleId: string;
    roleName: string;
  } | null>(null);

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Form submission states
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filter roles by search query
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
    );
  }, [roles, searchQuery]);

  // Handle create role submission
  const handleCreateRoleSubmit = async (name: string, description?: string) => {
    try {
      setModalError(null);
      setIsCreateSubmitting(true);
      const newRole = await createRole(name, description);
      if (onRoleCreated) {
        onRoleCreated(newRole);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create role. Please try again.';
      setModalError(errorMessage);
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  // Handle edit role submission
  const handleEditRoleSubmit = async (description?: string) => {
    if (!selectedRoleForEdit) return;
    try {
      setModalError(null);
      setIsEditSubmitting(true);
      await updateRole(selectedRoleForEdit.id, { description });
      if (onRoleUpdated) {
        onRoleUpdated({ ...selectedRoleForEdit, description });
      }
      setIsEditModalOpen(false);
      setSelectedRoleForEdit(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update role. Please try again.';
      setModalError(errorMessage);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle delete role confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      setIsDeleting(true);
      await deleteRole(deleteConfirmation.roleId);
      if (onRoleDeleted) {
        onRoleDeleted(deleteConfirmation.roleId);
      }
      setDeleteConfirmation(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete role. Please try again.';
      setModalError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header with title and action button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Custom Roles</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create and manage roles for your organization</p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors w-full sm:w-auto justify-center sm:justify-start"
          aria-label="Create a new custom role"
        >
          <Plus size={18} />
          <span>Add New Role</span>
        </button>
      </div>

      {/* Error state with retry */}
      {error && !isLoading && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 font-medium mt-2 flex items-center gap-1"
              aria-label="Retry loading roles"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Search/Filter input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search roles by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
          aria-label="Search roles"
        />
      </div>

      {/* Loading state - Skeleton cards */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse h-20" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredRoles.length === 0 && searchQuery.trim() === '' && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex justify-center items-center w-12 h-12 bg-brand-100 rounded-full mb-4">
            <Plus size={24} className="text-brand-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No roles yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first custom role to get started</p>
          <button
            onClick={() => {
              setModalError(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
            aria-label="Create first role"
          >
            Create First Role
          </button>
        </div>
      )}

      {/* Empty search results */}
      {!isLoading && filteredRoles.length === 0 && searchQuery.trim() !== '' && (
        <div className="text-center py-8 px-4">
          <Search size={32} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No roles match your search</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-brand-600 hover:text-brand-700 font-medium text-sm mt-2"
            aria-label="Clear search"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Roles table - Desktop view */}
      {!isLoading && filteredRoles.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Created Date
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role, index) => (
                <tr
                  key={role.id}
                  className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-white">{role.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {role.description || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(role.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedRoleForEdit(role);
                          setModalError(null);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        aria-label={`Edit role ${role.name}`}
                        title="Edit role"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirmation({ roleId: role.id, roleName: role.name })
                        }
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Delete role ${role.name}`}
                        title="Delete role"
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
      )}

      {/* Roles card view - Mobile */}
      {!isLoading && filteredRoles.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredRoles.map((role) => (
            <div key={role.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">{role.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {role.description || 'No description'}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Created: {formatDate(role.createdAt)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedRoleForEdit(role);
                    setModalError(null);
                    setIsEditModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  aria-label={`Edit role ${role.name}`}
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() =>
                    setDeleteConfirmation({ roleId: role.id, roleName: role.name })
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Delete role ${role.name}`}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setModalError(null);
        }}
        onSubmit={handleCreateRoleSubmit}
        isSubmitting={isCreateSubmitting}
        error={modalError}
      />

      {/* Edit Role Modal */}
      {selectedRoleForEdit && (
        <EditRoleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRoleForEdit(null);
            setModalError(null);
          }}
          onSubmit={handleEditRoleSubmit}
          isSubmitting={isEditSubmitting}
          error={modalError}
          currentRole={selectedRoleForEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <DeleteConfirmationDialog
          isOpen={true}
          title="Delete Role"
          message={`Are you sure you want to delete the role "${deleteConfirmation.roleName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmation(null)}
          isLoading={isDeleting}
          isDangerous
        />
      )}
    </div>
  );
}
