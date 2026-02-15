/**
 * UserModal Component Tests
 * Unified tests for create and edit modes
 * Merged from CreateUserModal.test.tsx (EditUserModal had no tests)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserModal } from './UserModal';
import type { User } from '../../types';

const mockRoles = [
  { id: 'role-1', name: 'employee', description: 'Employee', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
  { id: 'role-2', name: 'manager', description: 'Manager', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
  { id: 'role-3', name: 'admin', description: 'Admin', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
];

const mockUser: User = {
  id: 'user-1',
  email: 'jane@company.com',
  name: 'Jane Doe',
  roles: ['manager'],
  profiles: ['Engineering'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'admin',
};

describe('UserModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CREATE MODE
  // ==========================================================================

  describe('UserModal - create mode', () => {
    it('should render modal when open', () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByText('Add System User')).toBeInTheDocument();
      expect(screen.getByLabelText('User email')).toBeInTheDocument();
      expect(screen.getByLabelText('User name')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      const { container } = render(
        <UserModal
          mode="create"
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('should show intro section (amber box) in create mode', () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      expect(screen.getByText(/Add a manager, admin, or contractor/i)).toBeInTheDocument();
    });

    it('should validate email field', async () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const emailInput = screen.getByLabelText('User email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate name field', async () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const nameInput = screen.getByLabelText('User name');
      fireEvent.change(nameInput, { target: { value: 'A' } });

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    it('should validate role selection', async () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select at least one role')).toBeInTheDocument();
      });
    });

    it('should submit form with valid data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const emailInput = screen.getByLabelText('User email');
      const nameInput = screen.getByLabelText('User name');
      const employeeCheckbox = screen.getByLabelText('Select role: employee');

      fireEvent.change(emailInput, { target: { value: 'john@company.com' } });
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.click(employeeCheckbox);

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@company.com',
            name: 'John Doe',
            roles: ['employee'],
          })
        );
      });
    });

    it('should select multiple roles', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const emailInput = screen.getByLabelText('User email');
      const nameInput = screen.getByLabelText('User name');
      const employeeCheckbox = screen.getByLabelText('Select role: employee');
      const managerCheckbox = screen.getByLabelText('Select role: manager');

      fireEvent.change(emailInput, { target: { value: 'john@company.com' } });
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.click(employeeCheckbox);
      fireEvent.click(managerCheckbox);

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            roles: expect.arrayContaining(['employee', 'manager']),
          })
        );
      });
    });

    it('should select profiles', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const emailInput = screen.getByLabelText('User email');
      const nameInput = screen.getByLabelText('User name');
      const employeeCheckbox = screen.getByLabelText('Select role: employee');
      const engineeringCheckbox = screen.getByLabelText('Select profile: Engineering');

      fireEvent.change(emailInput, { target: { value: 'john@company.com' } });
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.click(employeeCheckbox);
      fireEvent.click(engineeringCheckbox);

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            profiles: expect.arrayContaining(['Engineering']),
          })
        );
      });
    });

    it('should display server error', () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          error="Email already exists"
        />
      );

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    it('should disable submit button while submitting', () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByLabelText('Create user');
      expect(submitButton).toBeDisabled();
    });

    it('should close modal on cancel', () => {
      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const cancelButton = screen.getByLabelText('Cancel creating user');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should trim whitespace from inputs', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <UserModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
        />
      );

      const emailInput = screen.getByLabelText('User email');
      const nameInput = screen.getByLabelText('User name');
      const employeeCheckbox = screen.getByLabelText('Select role: employee');

      fireEvent.change(emailInput, { target: { value: '  john@company.com  ' } });
      fireEvent.change(nameInput, { target: { value: '  John Doe  ' } });
      fireEvent.click(employeeCheckbox);

      const submitButton = screen.getByLabelText('Create user');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@company.com',
            name: 'John Doe',
          })
        );
      });
    });
  });

  // ==========================================================================
  // EDIT MODE
  // ==========================================================================

  describe('UserModal - edit mode', () => {
    it('should show "Edit User: {name}" title', () => {
      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
        />
      );

      expect(screen.getByText(`Edit User: ${mockUser.name}`)).toBeInTheDocument();
    });

    it('should pre-fill form fields from user prop', () => {
      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
        />
      );

      const emailInput = screen.getByLabelText('User email') as HTMLInputElement;
      const nameInput = screen.getByLabelText('User name') as HTMLInputElement;

      expect(emailInput.value).toBe(mockUser.email);
      expect(nameInput.value).toBe(mockUser.name);
    });

    it('should not show intro section (amber box) in edit mode', () => {
      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
        />
      );

      expect(screen.queryByText(/Add a manager, admin, or contractor/i)).not.toBeInTheDocument();
    });

    it('should show "Save Changes" submit button', () => {
      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
        />
      );

      expect(screen.getByLabelText('Save user changes')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should return null when user is null', () => {
      const { container } = render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={null}
        />
      );

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('should submit form with valid data in edit mode', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
        />
      );

      const submitButton = screen.getByLabelText('Save user changes');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: mockUser.email,
            name: mockUser.name,
            roles: mockUser.roles,
          })
        );
      });
    });

    it('should show "Saving..." loading state in edit mode', () => {
      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
          isSubmitting={true}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should close modal on cancel in edit mode', () => {
      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
        />
      );

      const cancelButton = screen.getByLabelText('Cancel editing user');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display server error in edit mode', () => {
      render(
        <UserModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          roles={mockRoles}
          user={mockUser}
          error="Failed to update user"
        />
      );

      expect(screen.getByText('Failed to update user')).toBeInTheDocument();
    });
  });
});
