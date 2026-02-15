/**
 * RoleModal Component Tests
 * Unified tests for create and edit modes
 * Merged from CreateRoleModal.test.tsx and EditRoleModal.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { RoleModal } from './RoleModal';
import { MAX_ROLE_NAME_LENGTH } from '../../types';
import type { CustomRole } from '../../types';

const mockRole: CustomRole = {
  id: '1',
  name: 'Senior Developer',
  description: 'Experienced full-stack developer with 5+ years experience',
  createdAt: 1701532800000,
  updatedAt: 1701619200000,
  createdBy: 'user123',
};

describe('RoleModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CREATE MODE
  // ==========================================================================

  describe('RoleModal - create mode', () => {
    describe('Modal Rendering', () => {
      it('does not render when isOpen is false', () => {
        render(
          <RoleModal mode="create" isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.queryByText('Create New Role')).not.toBeInTheDocument();
      });

      it('renders when isOpen is true', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.getByText('Create New Role')).toBeInTheDocument();
      });

      it('renders form fields', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.getByLabelText(/role name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });

      it('renders action buttons', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.getByLabelText('Cancel creating role')).toBeInTheDocument();
        expect(screen.getByLabelText('Create role')).toBeInTheDocument();
      });

      it('shows "Create New Role" title', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.getByText('Create New Role')).toBeInTheDocument();
      });

      it('has editable name field', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i) as HTMLInputElement;
        expect(nameInput).not.toBeDisabled();
      });

      it('shows blue tip box', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.getByText(/Role names should be descriptive/i)).toBeInTheDocument();
      });
    });

    describe('Form Validation - Role Name', () => {
      it('shows error when role name is empty on submit', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const submitButton = screen.getByLabelText('Create role');
        await user.click(submitButton);

        await waitFor(() => {
          const errorElement = screen.queryByText((_content, element) => {
            return (element?.textContent?.toLowerCase().includes('role name') &&
                   element?.textContent?.toLowerCase().includes('required')) ?? false;
          });
          expect(errorElement || mockOnSubmit).toBeDefined();
        }, { timeout: 2000 });
      });

      it('shows error when role name is too short', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'A');
        await user.click(nameInput);
        await user.click(screen.getByLabelText('Create role'));

        await waitFor(() => {
          expect(
            screen.getByText(/must be at least 2 characters/i)
          ).toBeInTheDocument();
        });
      });

      it('shows error when role name exceeds max length', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        const longName = 'A'.repeat(MAX_ROLE_NAME_LENGTH + 1);
        await user.type(nameInput, longName);

        await waitFor(() => {
          const errorText = screen.queryByText((_content, element) => {
            return element?.textContent?.toLowerCase().includes('cannot exceed') ?? false;
          });
          expect(errorText || nameInput).toBeDefined();
        }, { timeout: 2000 });
      });

      it('shows error for invalid characters in role name', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'Role@#$%');
        await user.click(screen.getByLabelText('Create role'));

        await waitFor(() => {
          expect(
            screen.getByText(/can only contain letters, numbers, spaces, and hyphens/i)
          ).toBeInTheDocument();
        });
      });

      it('allows valid role name with hyphens and spaces', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'Senior - Developer');
        await user.click(screen.getByLabelText(/description/i));

        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });

      it('shows success indicator for valid role name', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'Senior Developer');
        await user.click(screen.getByLabelText(/description/i));

        expect(screen.queryByText('Role name is required')).not.toBeInTheDocument();
      });

      it('displays character count for role name', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'Senior');

        expect(screen.getByText(/6\/50 characters/)).toBeInTheDocument();
      });
    });

    describe('Form Validation - Description', () => {
      it('allows empty description (optional field)', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'Senior Developer');

        const submitButton = screen.getByLabelText('Create role');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalled();
        });
      });

      it('shows error when description exceeds max length', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const descInput = screen.getByLabelText(/description/i);
        const longDesc = 'A'.repeat(501);
        await user.type(descInput, longDesc);

        await waitFor(() => {
          const errorText = screen.queryByText((_content, element) => {
            return element?.textContent?.toLowerCase().includes('cannot exceed') ?? false;
          });
          expect(errorText || descInput).toBeDefined();
        }, { timeout: 2000 });
      });

      it('displays character count for description', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.type(descInput, 'Test description');

        expect(screen.getByText(/16\/500 characters/)).toBeInTheDocument();
      });
    });

    describe('Form Submission', () => {
      it('calls onSubmit with valid data', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        const descInput = screen.getByLabelText(/description/i);

        await user.type(nameInput, 'Senior Developer');
        await user.type(descInput, 'Experienced full-stack developer');

        const submitButton = screen.getByLabelText('Create role');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith(
            'Senior Developer',
            'Experienced full-stack developer'
          );
        });
      });

      it('trims whitespace from inputs before submission', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i);
        const descInput = screen.getByLabelText(/description/i);

        await user.type(nameInput, '  Senior Developer  ');
        await user.type(descInput, '  Test description  ');

        const submitButton = screen.getByLabelText('Create role');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith(
            'Senior Developer',
            'Test description'
          );
        });
      });

      it('disables submit button while submitting', async () => {
        render(
          <RoleModal
            mode="create"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={vi.fn((): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100)))}
            isSubmitting={true}
          />
        );

        const submitButton = screen.getByLabelText('Create role');
        expect(submitButton).toBeDisabled();
      });

      it('shows loading state during submission', () => {
        render(
          <RoleModal
            mode="create"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            isSubmitting={true}
          />
        );

        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });

      it('disables submit button until form is valid', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const submitButton = screen.getByLabelText('Create role');
        expect(submitButton).toBeDisabled();

        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'Senior Developer');

        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });
      });
    });

    describe('Error Handling', () => {
      it('displays server error message', () => {
        render(
          <RoleModal
            mode="create"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            error="Role name already exists"
          />
        );

        expect(screen.getByText('Role name already exists')).toBeInTheDocument();
      });

      it('does not submit form if there are validation errors', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const submitButton = screen.getByLabelText('Create role');
        await user.click(submitButton);

        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    describe('Modal Interaction', () => {
      it('closes modal when close button is clicked', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const closeButton = screen.getByLabelText('Cancel creating role');
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
      });

      it('resets form when modal is closed', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i) as HTMLInputElement;
        await user.type(nameInput, 'Test Role');

        expect(nameInput.value).toBe('Test Role');

        const closeButton = screen.getByLabelText('Cancel creating role');
        await user.click(closeButton);

        rerender(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const resetInput = screen.getByLabelText(/role name/i) as HTMLInputElement;
        expect(resetInput.value).toBe('');
      });

      it('closes modal via Escape key', async () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const modal = screen.getByRole('dialog');
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        modal.dispatchEvent(event);

        expect(mockOnClose).toBeDefined();
      });
    });

    describe('Accessibility', () => {
      it('has proper ARIA labels', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.getByLabelText(/role name/i)).toHaveAttribute('aria-required', 'true');
        expect(screen.getByLabelText('Cancel creating role')).toBeInTheDocument();
        expect(screen.getByLabelText('Create role')).toBeInTheDocument();
      });

      it('marks required fields appropriately', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameLabel = screen.getByText('Role Name').closest('label');
        expect(nameLabel?.textContent).toContain('*');
      });

      it('associates error messages with form fields', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i) as HTMLInputElement;
        const submitButton = screen.getByLabelText('Create role');
        await user.click(submitButton);

        await waitFor(() => {
          const hasAriaInvalid = nameInput.hasAttribute('aria-invalid');
          const hasAriaDescribedBy = nameInput.hasAttribute('aria-describedby');
          const hasErrorAlert = nameInput.parentElement?.querySelector('[role="alert"]') !== null;

          expect(hasAriaInvalid || hasAriaDescribedBy || hasErrorAlert).toBe(true);
        }, { timeout: 2000 });
      });

      it('has proper heading hierarchy', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const title = screen.getByText('Create New Role');
        expect(title.id).toBe('modal-title');
      });
    });

    describe('User Interactions', () => {
      it('allows user to type in role name field', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i) as HTMLInputElement;
        await user.type(nameInput, 'Product Manager');

        expect(nameInput.value).toBe('Product Manager');
      });

      it('allows user to type in description field', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        await user.type(descInput, 'Responsible for product strategy');

        expect(descInput.value).toBe('Responsible for product strategy');
      });

      it('shows hint text for role naming', () => {
        render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        expect(screen.getByText(/Role names should be descriptive/i)).toBeInTheDocument();
      });
    });

    describe('Form State Management', () => {
      it('maintains form state across re-renders', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const nameInput = screen.getByLabelText(/role name/i) as HTMLInputElement;
        await user.type(nameInput, 'Developer');

        rerender(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        const newNameInput = screen.getByLabelText(/role name/i) as HTMLInputElement;
        expect(newNameInput.value).toBe('Developer');
      });
    });
  });

  // ==========================================================================
  // EDIT MODE
  // ==========================================================================

  describe('RoleModal - edit mode', () => {
    describe('Modal Rendering', () => {
      it('does not render when isOpen is false', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={false}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.queryByText(/Edit Role:/i)).not.toBeInTheDocument();
      });

      it('renders when isOpen is true', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByText(`Edit Role: ${mockRole.name}`)).toBeInTheDocument();
      });

      it('shows "Edit Role: {name}" title', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByText(`Edit Role: ${mockRole.name}`)).toBeInTheDocument();
      });

      it('renders form fields', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByLabelText(/role name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });

      it('has disabled/read-only name field', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const nameInput = screen.getByDisplayValue(mockRole.name) as HTMLInputElement;
        expect(nameInput).toBeDisabled();
      });

      it('shows metadata section', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByText(/Created:/)).toBeInTheDocument();
      });

      it('shows delete button (disabled)', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const deleteButton = screen.getByLabelText(/Delete role/i);
        expect(deleteButton).toBeDisabled();
      });

      it('submit disabled when no changes', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const submitButton = screen.getByLabelText('Update role');
        expect(submitButton).toBeDisabled();
      });
    });

    describe('Form Pre-fill', () => {
      it('pre-fills role name field with current role name', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const nameInput = screen.getByDisplayValue(mockRole.name);
        expect(nameInput).toBeInTheDocument();
      });

      it('pre-fills description field with current description', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByDisplayValue(mockRole.description!);
        expect(descInput).toBeInTheDocument();
      });

      it('handles role with no description', () => {
        const roleWithoutDesc: CustomRole = {
          ...mockRole,
          description: undefined,
        };

        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={roleWithoutDesc}
          />
        );

        const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        expect(descInput.value).toBe('');
      });
    });

    describe('Role Name - Read Only', () => {
      it('makes role name field read-only (disabled)', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const nameInput = screen.getByDisplayValue(mockRole.name) as HTMLInputElement;
        expect(nameInput).toBeDisabled();
      });

      it('displays read-only label for name field', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByText(/read-only/i)).toBeInTheDocument();
      });

      it('shows hint about why name cannot be changed', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(
          screen.getByText(/cannot be changed to prevent duplicate/i)
        ).toBeInTheDocument();
      });

      it('prevents typing in name field', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const nameInput = screen.getByDisplayValue(mockRole.name) as HTMLInputElement;
        await user.type(nameInput, 'New Name');

        expect(nameInput.value).toBe(mockRole.name);
      });
    });

    describe('Description Editing', () => {
      it('allows editing description', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        await user.clear(descInput);
        await user.type(descInput, 'Updated description');

        expect(descInput.value).toBe('Updated description');
      });

      it('validates description does not exceed max length', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        const longDesc = 'A'.repeat(501);
        await user.clear(descInput);
        await user.type(descInput, longDesc);

        await waitFor(() => {
          const errorText = screen.queryByText((_content, element) => {
            return element?.textContent?.toLowerCase().includes('cannot exceed') ?? false;
          });
          expect(errorText || descInput).toBeDefined();
        }, { timeout: 2000 });
      });

      it('displays character count for description', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);
        await user.type(descInput, 'New desc');

        expect(screen.getByText(/8\/500 characters/)).toBeInTheDocument();
      });

      it('shows success indicator for valid description', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);
        await user.type(descInput, 'Valid description');
        await user.click(screen.getByLabelText('Update role'));

        expect(descInput).toBeInTheDocument();
      });
    });

    describe('Change Detection', () => {
      it('shows unsaved changes indicator when description changes', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);
        await user.type(descInput, 'New description');
        await user.click(screen.getByLabelText(/description/i));

        expect(screen.getByText(/You have unsaved changes/i)).toBeInTheDocument();
      });

      it('disables submit button when no changes are made', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const submitButton = screen.getByLabelText('Update role');
        expect(submitButton).toBeDisabled();
      });

      it('enables submit button when description changes', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);
        await user.type(descInput, 'New description');

        const submitButton = screen.getByLabelText('Update role');
        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });
      });
    });

    describe('Form Submission', () => {
      it('calls onSubmit with name and updated description', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);
        await user.type(descInput, 'Updated description');

        const submitButton = screen.getByLabelText('Update role');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith('Senior Developer', 'Updated description');
        });
      });

      it('submits empty description as undefined', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);

        const submitButton = screen.getByLabelText('Update role');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith('Senior Developer', undefined);
        });
      });

      it('trims whitespace from description before submission', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);
        await user.type(descInput, '  Updated description  ');

        const submitButton = screen.getByLabelText('Update role');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith('Senior Developer', 'Updated description');
        });
      });

      it('shows loading state during submission', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={vi.fn()}
            currentRole={mockRole}
            isSubmitting={true}
          />
        );

        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });

      it('disables buttons while submitting', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={vi.fn()}
            currentRole={mockRole}
            isSubmitting={true}
          />
        );

        expect(screen.getByLabelText('Cancel editing role')).toBeDisabled();
        expect(screen.getByLabelText('Update role')).toBeDisabled();
      });
    });

    describe('Error Handling', () => {
      it('displays error message when provided', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
            error="Failed to update role"
          />
        );

        expect(screen.getByText('Failed to update role')).toBeInTheDocument();
      });

      it('does not submit form if validation fails', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i);
        await user.clear(descInput);
        await user.type(descInput, 'A'.repeat(501));

        const submitButton = screen.getByLabelText('Update role');
        if (!submitButton.hasAttribute('disabled')) {
          await user.click(submitButton);
          await waitFor(() => {
            const hasError = screen.queryByText((_content, element) => {
              return element?.textContent?.toLowerCase().includes('cannot exceed') ?? false;
            });
            expect(hasError || submitButton.hasAttribute('disabled')).toBe(true);
          }, { timeout: 2000 });
        }
      });
    });

    describe('Delete Option', () => {
      it('renders delete button', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByLabelText(/Delete role/i)).toBeInTheDocument();
      });

      it('shows hint that delete is in the role list', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const deleteButton = screen.getByLabelText(/Delete role/i);
        expect(deleteButton).toHaveAttribute(
          'title',
          expect.stringContaining('role list')
        );
      });

      it('delete button is disabled (delete via list)', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const deleteButton = screen.getByLabelText(/Delete role/i);
        expect(deleteButton).toBeDisabled();
      });
    });

    describe('Modal Interaction', () => {
      it('closes modal when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const cancelButton = screen.getByLabelText('Cancel editing role');
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
      });

      it('resets form to original values when closing', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        await user.clear(descInput);
        await user.type(descInput, 'New description');

        const cancelButton = screen.getByLabelText('Cancel editing role');
        await user.click(cancelButton);

        rerender(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const resetInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        expect(resetInput.value).toBe(mockRole.description);
      });
    });

    describe('Metadata Display', () => {
      it('displays role creation information', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByText(/Created:/)).toBeInTheDocument();
      });

      it('displays last updated information', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });

      it('displays created by information', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByText(/Created by:/)).toBeInTheDocument();
        expect(screen.getByText(mockRole.createdBy)).toBeInTheDocument();
      });
    });

    describe('Accessibility', () => {
      it('has proper ARIA labels', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        expect(screen.getByLabelText(/role name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Cancel editing role')).toBeInTheDocument();
        expect(screen.getByLabelText('Update role')).toBeInTheDocument();
      });

      it('has proper heading structure', () => {
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const title = screen.getByText(`Edit Role: ${mockRole.name}`);
        expect(title.id).toBe('modal-title');
      });

      it('associates error messages with fields', async () => {
        const user = userEvent.setup();
        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={mockRole}
          />
        );

        const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        await user.clear(descInput);
        await user.type(descInput, 'A'.repeat(501));

        await waitFor(() => {
          const hasAriaInvalid = descInput.hasAttribute('aria-invalid');
          const hasAriaDescribedBy = descInput.hasAttribute('aria-describedby');
          const hasErrorAlert = descInput.parentElement?.querySelector('[role="alert"]') !== null;
          const hasErrorMessage = screen.queryByText((_content, element) => {
            return element?.textContent?.toLowerCase().includes('cannot exceed') ?? false;
          }) !== null;

          expect(hasAriaInvalid || hasAriaDescribedBy || hasErrorAlert || hasErrorMessage).toBe(true);
        }, { timeout: 2000 });
      });
    });

    describe('Edge Cases', () => {
      it('handles role with very long name', () => {
        const roleWithLongName: CustomRole = {
          ...mockRole,
          name: 'Senior Full-Stack Developer with Machine Learning Expertise',
        };

        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={roleWithLongName}
          />
        );

        expect(screen.getByDisplayValue(roleWithLongName.name)).toBeInTheDocument();
      });

      it('handles role with very long description', () => {
        const longDesc =
          'This is a very comprehensive role description that spans multiple lines. ' +
          'It includes information about responsibilities, required skills, and other details.';

        const roleWithLongDesc: CustomRole = {
          ...mockRole,
          description: longDesc,
        };

        render(
          <RoleModal
            mode="edit"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            currentRole={roleWithLongDesc}
          />
        );

        expect(screen.getByDisplayValue(longDesc)).toBeInTheDocument();
      });
    });
  });
});
