/**
 * AssignRoleModal Tests
 * Tests for the modal that assigns role + department + template to an unassigned user
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignRoleModal } from './AssignRoleModal';
import type { User, CustomRole, Template } from '../../types';

const mockUser: User = {
  id: 'user-google-1',
  email: 'jane@gmail.com',
  name: 'Jane Doe',
  roles: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: '',
};

const mockRoles: CustomRole[] = [
  { id: 'role-1', name: 'employee', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
  { id: 'role-2', name: 'manager', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
];

const mockTemplates: Template[] = [
  {
    id: 'tmpl-1',
    name: 'Engineer Onboarding',
    description: 'For engineers',
    role: 'employee',
    steps: [
      { id: 1, title: 'Setup laptop', description: 'Get your laptop', role: 'All', owner: 'IT', expert: '', status: 'pending' as const, link: '' },
      { id: 2, title: 'Meet team', description: 'Say hello', role: 'All', owner: 'HR', expert: '', status: 'pending' as const, link: '' },
    ],
    createdAt: Date.now(),
    isActive: true,
  },
  {
    id: 'tmpl-2',
    name: 'Sales Onboarding',
    description: 'For sales',
    role: 'employee',
    steps: [],
    createdAt: Date.now(),
    isActive: true,
  },
];

describe('AssignRoleModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renders name and email as read-only fields', () => {
    render(
      <AssignRoleModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        user={mockUser}
        isSubmitting={false}
        error={null}
        roles={mockRoles}
        rolesLoading={false}
        templates={mockTemplates}
        templatesLoading={false}
      />,
    );

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveValue('Jane Doe');
    expect(nameInput).toHaveAttribute('readOnly');

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveValue('jane@gmail.com');
    expect(emailInput).toHaveAttribute('readOnly');
  });

  it('role selector populates from roles prop', () => {
    render(
      <AssignRoleModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        user={mockUser}
        isSubmitting={false}
        error={null}
        roles={mockRoles}
        rolesLoading={false}
        templates={mockTemplates}
        templatesLoading={false}
      />,
    );

    const roleSelect = screen.getByLabelText(/^role/i);
    expect(roleSelect).toBeInTheDocument();

    // Check options
    const options = roleSelect.querySelectorAll('option');
    // Placeholder + 2 roles
    expect(options.length).toBe(3);
    expect(options[1]).toHaveTextContent('employee');
    expect(options[2]).toHaveTextContent('manager');
  });

  it('template selector populates from templates prop', () => {
    render(
      <AssignRoleModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        user={mockUser}
        isSubmitting={false}
        error={null}
        roles={mockRoles}
        rolesLoading={false}
        templates={mockTemplates}
        templatesLoading={false}
      />,
    );

    const templateSelect = screen.getByLabelText(/template/i);
    expect(templateSelect).toBeInTheDocument();

    const options = templateSelect.querySelectorAll('option');
    // Placeholder + 2 templates
    expect(options.length).toBe(3);
    expect(options[1]).toHaveTextContent('Engineer Onboarding');
    expect(options[2]).toHaveTextContent('Sales Onboarding');
  });

  it('validates required fields (role, department, template)', async () => {
    const user = userEvent.setup();
    render(
      <AssignRoleModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        user={mockUser}
        isSubmitting={false}
        error={null}
        roles={mockRoles}
        rolesLoading={false}
        templates={mockTemplates}
        templatesLoading={false}
      />,
    );

    // Click submit without filling in fields
    await user.click(screen.getByRole('button', { name: /^assign$/i }));

    // Validation errors should appear
    expect(screen.getByText(/role is required/i)).toBeInTheDocument();
    expect(screen.getByText(/department is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a template/i)).toBeInTheDocument();

    // onSubmit should NOT have been called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submit calls onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup();
    render(
      <AssignRoleModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        user={mockUser}
        isSubmitting={false}
        error={null}
        roles={mockRoles}
        rolesLoading={false}
        templates={mockTemplates}
        templatesLoading={false}
      />,
    );

    // Fill in required fields
    await user.selectOptions(screen.getByLabelText(/^role/i), 'employee');
    await user.type(screen.getByLabelText(/department/i), 'Engineering');
    await user.selectOptions(screen.getByLabelText(/template/i), 'tmpl-1');

    // Submit
    await user.click(screen.getByRole('button', { name: /^assign$/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      mockUser,
      'employee',
      'Engineering',
      'tmpl-1',
    );
  });

  it('displays error on submit failure', () => {
    render(
      <AssignRoleModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        user={mockUser}
        isSubmitting={false}
        error="Failed to assign role"
        roles={mockRoles}
        rolesLoading={false}
        templates={mockTemplates}
        templatesLoading={false}
      />,
    );

    expect(screen.getByText('Failed to assign role')).toBeInTheDocument();
  });
});
