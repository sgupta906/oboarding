/**
 * TemplatesView Component - Manager dashboard for template CRUD operations
 * Displays list of templates with ability to create, edit, and delete
 * Uses real-time subscription via useTemplates hook with optimistic updates
 */

import { useState } from 'react';
import { Plus, Loader2, AlertCircle, Edit2, Trash2, Copy } from 'lucide-react';
import { useTemplates, useRoles } from '../hooks';
import { TemplateModal } from '../components/templates/TemplateModal';
import { Badge } from '../components/ui';
import type { Template } from '../types';

/**
 * Renders the templates management dashboard
 * Allows managers to view, create, edit, and delete onboarding templates
 * Displays templates in a responsive table/card layout with real-time updates
 */
export function TemplatesView() {
  const { data: templates, isLoading, error, refetch, create, update, remove } = useTemplates();
  const { roles, isLoading: rolesLoading } = useRoles();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCreateTemplate = async (
    template: Omit<Template, 'id' | 'createdAt'>
  ) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      await create(template);
      setCreateModalOpen(false);
      showSuccessMessage('Template created successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create template';
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTemplate = async (
    templateData: Omit<Template, 'id' | 'createdAt'>,
    id?: string
  ) => {
    if (!id) return;
    setIsEditing(true);
    setEditError(null);

    try {
      await update(id, templateData);
      setEditModalOpen(false);
      setSelectedTemplate(null);
      showSuccessMessage('Template updated successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update template';
      setEditError(message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    setIsDeleting(true);

    try {
      await remove(id);
      setEditModalOpen(false);
      setSelectedTemplate(null);
      showSuccessMessage(`Template "${name}" deleted successfully`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete template';
      setEditError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    const { id: _id, createdAt: _createdAt, ...rest } = template;
    const newTemplate = {
      ...rest,
      name: `${template.name} (Copy)`,
    };
    await handleCreateTemplate(newTemplate);
  };

  const handleEditClick = (template: Template) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Onboarding Templates
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Create and manage templates for different roles
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            aria-label="Create new template"
          >
            <Plus size={20} />
            Create Template
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
            {successMessage}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-spin mx-auto" />
              <p className="text-slate-600 dark:text-slate-400">
                Loading templates...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Failed to load templates
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {error.message}
                </p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded font-medium transition-colors"
                  aria-label="Retry loading templates"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && templates.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
              <Plus size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No templates yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first onboarding template to get started
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
              aria-label="Create your first template"
            >
              <Plus size={20} />
              Create Template
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {!isLoading && !error && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-2">
                      {template.name}
                    </h3>
                    <Badge
                      color={template.isActive ? 'green' : 'amber'}
                      className="flex-shrink-0"
                    >
                      {template.isActive ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {template.description}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  {/* Role Badges */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Roles
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge color="blue" className="text-xs">
                        {template.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Steps Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Steps
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {template.steps.length}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Created
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatDate(template.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                  <button
                    onClick={() => handleEditClick(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 rounded transition-colors"
                    aria-label={`Edit template: ${template.name}`}
                    title="Edit template"
                  >
                    <Edit2 size={16} />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    aria-label={`Duplicate template: ${template.name}`}
                    title="Duplicate template"
                  >
                    <Copy size={16} />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                    className="flex items-center justify-center p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                    aria-label={`Delete template: ${template.name}`}
                    title="Delete template"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <TemplateModal
        mode="create"
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreateTemplate}
        isSubmitting={isCreating}
        error={createError}
        roles={roles}
        rolesLoading={rolesLoading}
      />

      {/* Edit Template Modal */}
      <TemplateModal
        mode="edit"
        isOpen={editModalOpen}
        template={selectedTemplate}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTemplate(null);
          setEditError(null);
        }}
        onSubmit={handleEditTemplate}
        onDelete={handleDeleteTemplate}
        isSubmitting={isEditing || isDeleting}
        error={editError}
        roles={roles}
        rolesLoading={rolesLoading}
      />
    </div>
  );
}
