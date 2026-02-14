/**
 * Unit tests for EditTemplateModal component
 * Tests pre-population, editing, and deletion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditTemplateModal } from './EditTemplateModal';
import type { Template } from '../../types';

// ============================================================================
// Test Data Fixtures
// ============================================================================

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

// ============================================================================
// Test Cases
// ============================================================================

describe('EditTemplateModal Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <EditTemplateModal
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
      <EditTemplateModal
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

  it('should pre-populate template name field', async () => {
    render(
      <EditTemplateModal
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
      <EditTemplateModal
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
      <EditTemplateModal
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

  it('should pre-populate step data', async () => {
    render(
      <EditTemplateModal
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

  it('should allow editing template name', async () => {
    const user = userEvent.setup();
    render(
      <EditTemplateModal
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
      <EditTemplateModal
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

  it('should have delete button', () => {
    render(
      <EditTemplateModal
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

  it('should show delete button in form', () => {
    render(
      <EditTemplateModal
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

  it('should have proper form structure for editing', async () => {
    render(
      <EditTemplateModal
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

  it('should close modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EditTemplateModal
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
      <EditTemplateModal
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
      <EditTemplateModal
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
      <EditTemplateModal
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
});
