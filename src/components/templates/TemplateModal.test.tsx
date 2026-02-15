/**
 * TemplateModal Component Tests
 * Unified tests for create and edit modes
 * Merged from CreateTemplateModal.test.tsx and EditTemplateModal.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateModal } from './TemplateModal';
import type { Template } from '../../types';

const mockRoles = [
  {
    id: 'role-1',
    name: 'Engineering',
    description: 'Engineering role',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin-user',
  },
  {
    id: 'role-2',
    name: 'Sales',
    description: 'Sales role',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin-user',
  },
  {
    id: 'role-3',
    name: 'Product',
    description: 'Product role',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin-user',
  },
];

const mockTemplate: Template = {
  id: 'template-1',
  name: 'Engineering Onboarding',
  description: 'Onboarding for engineers',
  role: 'Engineering',
  steps: [
    {
      id: 1,
      title: 'Setup Dev Environment',
      description: 'Install tools',
      role: 'Engineering',
      owner: 'DevOps',
      expert: 'John Doe',
      status: 'pending',
      link: '',
    },
  ],
  createdAt: Date.now(),
  isActive: true,
};

describe('TemplateModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CREATE MODE
  // ==========================================================================

  describe('TemplateModal - create mode', () => {
    it('should not render when isOpen is false', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(
        screen.queryByText('Create New Template')
      ).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });

    it('should show "Create New Template" title', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });

    it('should start with 1 empty step', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByLabelText('Step 1 title')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 1 description')).toBeInTheDocument();
    });

    it('should show template name input field', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByLabelText('Template Name')).toBeInTheDocument();
    });

    it('should show role selection checkboxes', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByLabelText('Include Engineering role')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Sales role')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Product role')).toBeInTheDocument();
    });

    it('should show status radio buttons', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByLabelText('Set status to Draft')).toBeInTheDocument();
      expect(screen.getByLabelText('Set status to Published')).toBeInTheDocument();
    });

    it('should validate template name is required', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Template name is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate at least one role is selected', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const templateNameInput = screen.getByLabelText('Template Name');
      await user.type(templateNameInput, 'Test Template');

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('At least one role must be selected')
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate at least one step with title and description', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const templateNameInput = screen.getByLabelText('Template Name');
      await user.type(templateNameInput, 'Test Template');

      const engineeringCheckbox = screen.getByLabelText('Include Engineering role');
      await user.click(engineeringCheckbox);

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/At least one step with title and description is required/)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should successfully submit valid form', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const templateNameInput = screen.getByLabelText('Template Name');
      await user.type(templateNameInput, 'Test Template');

      const engineeringCheckbox = screen.getByLabelText('Include Engineering role');
      await user.click(engineeringCheckbox);

      const stepTitleInput = screen.getByLabelText('Step 1 title');
      const stepDescInput = screen.getByLabelText('Step 1 description');

      await user.type(stepTitleInput, 'Step 1');
      await user.type(stepDescInput, 'Step 1 description');

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const submittedTemplate = mockOnSubmit.mock.calls[0][0];
      expect(submittedTemplate.name).toBe('Test Template');
      expect(submittedTemplate.role).toBe('Engineering');
    });

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should allow adding multiple steps', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const buttons = screen.getAllByRole('button');
      const addStepButton = buttons.find((btn) => btn.textContent?.includes('Add Step'));

      if (addStepButton) {
        await user.click(addStepButton);

        await waitFor(() => {
          expect(screen.getByLabelText('Step 2 title')).toBeInTheDocument();
        });
      }
    });

    it('should show step form with required fields', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByLabelText('Step 1 title')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 1 description')).toBeInTheDocument();
    });

    it('should display error message when provided', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          error="Failed to create template"
        />
      );

      expect(screen.getByText('Failed to create template')).toBeInTheDocument();
    });

    it('should disable submit button when submitting', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          isSubmitting={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) => btn.textContent?.includes('Saving'));
      expect(saveButton).toBeDefined();
      expect(saveButton).toBeDisabled();
    });

    it('should allow selecting multiple roles', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const engineeringCheckbox = screen.getByLabelText('Include Engineering role');
      const salesCheckbox = screen.getByLabelText('Include Sales role');

      await user.click(engineeringCheckbox);
      await user.click(salesCheckbox);

      expect(engineeringCheckbox).toBeChecked();
      expect(salesCheckbox).toBeChecked();
    });

    it('should set default status to Draft', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const draftRadio = screen.getByLabelText(
        'Set status to Draft'
      ) as HTMLInputElement;
      expect(draftRadio.checked).toBe(true);
    });
  });

  // ==========================================================================
  // EDIT MODE
  // ==========================================================================

  describe('TemplateModal - edit mode', () => {
    it('should not render when isOpen is false', () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={false}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      expect(screen.queryByText(/Edit Template:/)).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true with template', () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      expect(
        screen.getByText('Edit Template: Engineering Onboarding')
      ).toBeInTheDocument();
    });

    it('should show "Edit Template: {name}" title', () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      expect(
        screen.getByText('Edit Template: Engineering Onboarding')
      ).toBeInTheDocument();
    });

    it('should pre-fill steps from template', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Setup Dev Environment')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Install tools')).toBeInTheDocument();
      });
    });

    it('should show delete button', () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find((btn) => btn.textContent?.includes('Delete Template'));
      expect(deleteButton).toBeDefined();
    });

    it('should pre-populate template name field', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        const input = screen.getByDisplayValue('Engineering Onboarding');
        expect(input).toBeInTheDocument();
      });
    });

    it('should pre-populate template role', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        const engineeringCheckbox = screen.getByLabelText(
          'Include Engineering role'
        ) as HTMLInputElement;
        expect(engineeringCheckbox.checked).toBe(true);
      });
    });

    it('should pre-populate template status', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        const publishedRadio = screen.getByDisplayValue(
          'Published'
        ) as HTMLInputElement;
        expect(publishedRadio.checked).toBe(true);
      });
    });

    it('should allow editing template name', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      const input = screen.getByDisplayValue('Engineering Onboarding');
      await user.clear(input);
      await user.type(input, 'Updated Template Name');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Updated Template Name')).toBeInTheDocument();
      });
    });

    it('should submit updated template data', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) => btn.textContent?.includes('Save'));
      expect(saveButton).toBeDefined();

      if (saveButton) {
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalled();
        });
      }
    });

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display error message when provided', () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
          error="Failed to update template"
        />
      );

      expect(screen.getByText('Failed to update template')).toBeInTheDocument();
    });

    it('should disable save button when submitting', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
          isSubmitting={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) => btn.textContent?.includes('Saving'));
      expect(saveButton).toBeDefined();
      expect(saveButton).toBeDisabled();
    });

    it('should allow editing step data', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      const stepTitleInput = screen.getByDisplayValue('Setup Dev Environment');
      await user.clear(stepTitleInput);
      await user.type(stepTitleInput, 'Updated Step Title');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Updated Step Title')).toBeInTheDocument();
      });
    });

    it('should have proper form structure for editing', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplate}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Engineering Onboarding')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Setup Dev Environment')).toBeInTheDocument();
      });
    });
  });
});
