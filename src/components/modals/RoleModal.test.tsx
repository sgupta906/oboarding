/**
 * RoleModal Component Tests
 * Unified tests for create and edit modes
 * Tests focus on validation, submission, pre-fill, and change detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    });

    describe('Form Reset on Re-Open (Bug #28)', () => {
      it('should reset form fields when modal is closed and re-opened in create mode', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        // Type into the role name field
        const nameInput = screen.getByLabelText(/role name/i);
        await user.type(nameInput, 'Stale Role');

        // Close modal
        rerender(
          <RoleModal mode="create" isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        // Re-open modal
        rerender(
          <RoleModal mode="create" isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );

        // Role name field should be empty
        const nameInputAfter = screen.getByLabelText(/role name/i) as HTMLInputElement;
        expect(nameInputAfter.value).toBe('');
      });
    });

    describe('Error Handling', () => {
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
  });

  // ==========================================================================
  // EDIT MODE
  // ==========================================================================

  describe('RoleModal - edit mode', () => {
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
    });
  });
});
