/**
 * Tests for CreateUserModal Component
 * Validates form validation, submission, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateUserModal } from './CreateUserModal';

// Mock useRoles hook
vi.mock('../../hooks', () => ({
  useRoles: () => ({
    roles: [
      { id: 'role-1', name: 'employee', description: 'Employee' },
      { id: 'role-2', name: 'manager', description: 'Manager' },
      { id: 'role-3', name: 'admin', description: 'Admin' },
    ],
    isLoading: false,
  }),
}));

describe('CreateUserModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add System User')).toBeInTheDocument();
    expect(screen.getByLabelText('User email')).toBeInTheDocument();
    expect(screen.getByLabelText('User name')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    const { container } = render(
      <CreateUserModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should validate email field', async () => {
    render(
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        error="Email already exists"
      />
    );

    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('should disable submit button while submitting', () => {
    render(
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByLabelText('Create user');
    expect(submitButton).toBeDisabled();
  });

  it('should close modal on cancel', () => {
    render(
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByLabelText('Cancel creating user');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should trim whitespace from inputs', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
