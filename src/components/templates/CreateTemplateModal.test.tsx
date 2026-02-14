/**
 * Unit tests for CreateTemplateModal component
 * Tests form validation, submission, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTemplateModal } from './CreateTemplateModal';

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

// ============================================================================
// Test Cases
// ============================================================================

describe('CreateTemplateModal Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <CreateTemplateModal
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
      <CreateTemplateModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
      />
    );

    expect(screen.getByText('Create New Template')).toBeInTheDocument();
  });

  it('should show template name input field', () => {
    render(
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
      <CreateTemplateModal
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
