/**
 * TemplateModal Component Tests
 * Unified tests for create and edit modes
 * Tests focus on validation, submission, step management, and pre-fill
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

const mockTemplateWithMultipleSteps: Template = {
  id: 'template-multi',
  name: 'Multi-Step Onboarding',
  description: 'Onboarding with multiple steps',
  role: 'Engineering',
  steps: [
    {
      id: 1,
      title: 'Step A',
      description: 'Description A',
      role: 'Engineering',
      owner: 'Team Alpha',
      expert: 'Alice',
      status: 'pending',
      link: '',
    },
    {
      id: 2,
      title: 'Step B',
      description: 'Description B',
      role: 'Engineering',
      owner: 'Team Beta',
      expert: 'Bob',
      status: 'pending',
      link: '',
    },
    {
      id: 3,
      title: 'Step C',
      description: 'Description C',
      role: 'Engineering',
      owner: 'Team Gamma',
      expert: 'Charlie',
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
          screen.getByText(/At least one step with a title is required/)
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
  });

  // ==========================================================================
  // EDIT MODE
  // ==========================================================================

  describe('TemplateModal - edit mode', () => {
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
  });

  // ==========================================================================
  // STEP REORDER
  // ==========================================================================

  describe('TemplateModal - step reorder', () => {
    it('should move step down when clicking move-down button', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step A')).toBeInTheDocument();
      });

      const moveDownButton = screen.getByRole('button', { name: 'Move step 1 down' });
      await user.click(moveDownButton);

      await waitFor(() => {
        // After moving step 1 down, "Step B" should now be in position 1
        const step1Title = screen.getByLabelText('Step 1 title') as HTMLInputElement;
        const step2Title = screen.getByLabelText('Step 2 title') as HTMLInputElement;
        expect(step1Title.value).toBe('Step B');
        expect(step2Title.value).toBe('Step A');
      });
    });

    it('should move step up when clicking move-up button', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step B')).toBeInTheDocument();
      });

      const moveUpButton = screen.getByRole('button', { name: 'Move step 2 up' });
      await user.click(moveUpButton);

      await waitFor(() => {
        const step1Title = screen.getByLabelText('Step 1 title') as HTMLInputElement;
        const step2Title = screen.getByLabelText('Step 2 title') as HTMLInputElement;
        expect(step1Title.value).toBe('Step B');
        expect(step2Title.value).toBe('Step A');
      });
    });

    it('should disable move-up button for first step', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step A')).toBeInTheDocument();
      });

      const moveUpButton = screen.getByRole('button', { name: 'Move step 1 up' });
      expect(moveUpButton).toBeDisabled();
    });

    it('should disable move-down button for last step', async () => {
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step C')).toBeInTheDocument();
      });

      const moveDownButton = screen.getByRole('button', { name: 'Move step 3 down' });
      expect(moveDownButton).toBeDisabled();
    });

    it('should preserve step data after reorder', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step A')).toBeInTheDocument();
      });

      const moveDownButton = screen.getByRole('button', { name: 'Move step 1 down' });
      await user.click(moveDownButton);

      await waitFor(() => {
        // "Step A" moved to position 2 -- verify owner and expert moved with it
        const step2Owner = screen.getByLabelText('Step 2 owner') as HTMLInputElement;
        const step2Expert = screen.getByLabelText('Step 2 expert') as HTMLInputElement;
        expect(step2Owner.value).toBe('Team Alpha');
        expect(step2Expert.value).toBe('Alice');
      });
    });

    it('should update step numbers after reorder', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step A')).toBeInTheDocument();
      });

      const moveDownButton = screen.getByRole('button', { name: 'Move step 1 down' });
      await user.click(moveDownButton);

      await waitFor(() => {
        // After reorder, "Step 1 of 3" should be associated with "Step B" content
        expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
        expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
      });
    });

    it('should submit correct step IDs after reorder', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step A')).toBeInTheDocument();
      });

      // Reorder: move step 1 down so [A, B, C] becomes [B, A, C]
      const moveDownButton = screen.getByRole('button', { name: 'Move step 1 down' });
      await user.click(moveDownButton);

      await waitFor(() => {
        const step1Title = screen.getByLabelText('Step 1 title') as HTMLInputElement;
        expect(step1Title.value).toBe('Step B');
      });

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /save template changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      const submittedSteps = submittedData.steps;

      // After reorder [B, A, C], step IDs should be new positions [1, 2, 3]
      expect(submittedSteps[0].id).toBe(1);
      expect(submittedSteps[1].id).toBe(2);
      expect(submittedSteps[2].id).toBe(3);

      // Verify titles match the reordered sequence
      expect(submittedSteps[0].title).toBe('Step B');
      expect(submittedSteps[1].title).toBe('Step A');
      expect(submittedSteps[2].title).toBe('Step C');
    });
  });

  // ==========================================================================
  // STEP COUNT
  // ==========================================================================

  describe('TemplateModal - step count', () => {
    it('should display step count in section label', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByText('Onboarding Steps (1)')).toBeInTheDocument();
    });

    it('should update step count when adding steps', async () => {
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

      const addStepButton = screen.getByRole('button', { name: /add new step/i });
      await user.click(addStepButton);

      await waitFor(() => {
        expect(screen.getByText('Onboarding Steps (2)')).toBeInTheDocument();
      });
    });

    it('should update step count when removing steps', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="edit"
          isOpen={true}
          template={mockTemplateWithMultipleSteps}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          roles={mockRoles}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Step C')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: 'Remove step 3' });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText('Onboarding Steps (2)')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // MODAL SIZE
  // ==========================================================================

  describe('TemplateModal - modal size', () => {
    it('should render modal with 2xl width', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('max-w-2xl');
    });
  });

  // ==========================================================================
  // INITIAL STEPS (PDF IMPORT)
  // ==========================================================================

  describe('TemplateModal - initialSteps prop (PDF import)', () => {
    const importedSteps = [
      { title: 'Setup laptop', description: '' },
      { title: 'Install IDE', description: '' },
      { title: 'Configure VPN', description: '' },
    ];

    it('should pre-fill step titles from initialSteps when in create mode', async () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          initialSteps={importedSteps}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Setup laptop')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Install IDE')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Configure VPN')).toBeInTheDocument();
      });
    });

    it('should pre-fill empty descriptions for imported steps', async () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          initialSteps={importedSteps}
        />
      );

      await waitFor(() => {
        const desc1 = screen.getByLabelText('Step 1 description') as HTMLTextAreaElement;
        const desc2 = screen.getByLabelText('Step 2 description') as HTMLTextAreaElement;
        const desc3 = screen.getByLabelText('Step 3 description') as HTMLTextAreaElement;
        expect(desc1.value).toBe('');
        expect(desc2.value).toBe('');
        expect(desc3.value).toBe('');
      });
    });

    it('should show info banner with step count and filename when pdfFileName is provided', async () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          initialSteps={importedSteps}
          pdfFileName="onboarding-checklist.pdf"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/3 steps imported from onboarding-checklist\.pdf/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show info banner when pdfFileName is not provided', () => {
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          initialSteps={importedSteps}
        />
      );

      expect(
        screen.queryByText(/steps imported from/i)
      ).not.toBeInTheDocument();
    });

    it('should still validate form (name, role required) even with pre-filled steps', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          initialSteps={importedSteps}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Template name is required')).toBeInTheDocument();
        expect(screen.getByText('At least one role must be selected')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should allow editing pre-filled step titles before saving', async () => {
      const user = userEvent.setup();
      render(
        <TemplateModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          initialSteps={importedSteps}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Setup laptop')).toBeInTheDocument();
      });

      const step1Title = screen.getByDisplayValue('Setup laptop');
      await user.clear(step1Title);
      await user.type(step1Title, 'Setup MacBook Pro');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Setup MacBook Pro')).toBeInTheDocument();
      });
    });
  });
});
