/**
 * Unit tests for CreateOnboardingModal component
 * Tests form validation, template preview, submission, and whitespace trimming
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateOnboardingModal } from './CreateOnboardingModal';

// ============================================================================
// Mock Data
// ============================================================================

const mockTemplates = [
  {
    id: 'template-1',
    name: 'Engineering Onboarding',
    description: 'Complete onboarding for engineering roles',
    role: 'Engineering',
    steps: [
      {
        id: 1,
        title: 'Setup Dev Environment',
        description: 'Install required tools',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'John Doe',
        status: 'pending' as const,
        link: '',
      },
      {
        id: 2,
        title: 'Code Review Training',
        description: 'Learn code review process',
        role: 'Engineering',
        owner: 'Engineering',
        expert: 'Jane Smith',
        status: 'pending' as const,
        link: '',
      },
    ],
    createdAt: Date.now(),
    isActive: true,
  },
  {
    id: 'template-2',
    name: 'Sales Onboarding',
    description: 'Complete onboarding for sales roles',
    role: 'Sales',
    steps: [
      {
        id: 1,
        title: 'Product Training',
        description: 'Learn our product',
        role: 'Sales',
        owner: 'Sales',
        expert: 'Bob Johnson',
        status: 'pending' as const,
        link: '',
      },
    ],
    createdAt: Date.now(),
    isActive: true,
  },
];

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
  {
    id: 'role-4',
    name: 'HR',
    description: 'HR role',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin-user',
  },
];

// ============================================================================
// Test Setup
// ============================================================================

describe('CreateOnboardingModal Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Validation Errors
  // ============================================================================

  it('should show validation error for missing employee name', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    expect(
      await screen.findByText(/employee name is required/i)
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for missing email', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for missing role', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    expect(screen.getByText(/role is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for missing department', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText('Employee role'),
      'Engineering'
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    expect(screen.getByText(/department is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for missing template', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText('Employee role'),
      'Engineering'
    );
    await user.type(screen.getByLabelText(/department/i), 'Engineering');

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    expect(
      screen.getByText(/please select a template/i)
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Successful Submission
  // ============================================================================

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText('Employee role'),
      'Engineering'
    );
    await user.type(screen.getByLabelText(/department/i), 'Engineering');
    await user.selectOptions(
      screen.getByLabelText(/onboarding template/i),
      'template-1'
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeName: 'John Doe',
          employeeEmail: 'john@example.com',
          role: 'Engineering',
          department: 'Engineering',
          templateId: 'template-1',
        })
      );
    });
  });

  it('should include optional start date in submission', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText('Employee role'),
      'Engineering'
    );
    await user.type(screen.getByLabelText(/department/i), 'Engineering');
    await user.selectOptions(
      screen.getByLabelText(/onboarding template/i),
      'template-1'
    );
    await user.type(screen.getByLabelText(/start date/i), '2024-01-15');

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeName: 'John Doe',
          startDate: expect.any(Number),
        })
      );
    });
  });

  // ============================================================================
  // Template Preview
  // ============================================================================

  it('should display template preview when template is selected', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.selectOptions(
      screen.getByLabelText(/onboarding template/i),
      'template-1'
    );

    expect(screen.getByText(/template preview/i)).toBeInTheDocument();
    const preview = screen.getByText(/template preview/i).closest('div');
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toContain('Engineering Onboarding');
    expect(preview?.textContent).toContain('2 steps');
    expect(screen.getByText(/setup dev environment/i)).toBeInTheDocument();
    expect(screen.getByText(/code review training/i)).toBeInTheDocument();
  });

  it('should show preview with truncated steps for large templates', async () => {
    const largeTemplate = {
      id: 'large-template',
      name: 'Large Template',
      description: 'Template with many steps',
      role: 'Engineering',
      steps: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Step ${i + 1}`,
        description: `Description ${i + 1}`,
        role: 'Engineering',
        owner: 'Owner',
        expert: 'Expert',
        status: 'pending' as const,
        link: '',
      })),
      createdAt: Date.now(),
      isActive: true,
    };

    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={[largeTemplate]}
      />
    );

    await user.selectOptions(
      screen.getByLabelText(/onboarding template/i),
      'large-template'
    );

    expect(screen.getByText(/10 steps:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/and 5 more/i)
    ).toBeInTheDocument();
  });

  // ============================================================================
  // Whitespace Trimming
  // ============================================================================

  it('should trim whitespace from form inputs', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        roles={mockRoles}
        templates={mockTemplates}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), '  John Doe  ');
    await user.type(
      screen.getByLabelText(/email address/i),
      '  john@example.com  '
    );
    await user.selectOptions(
      screen.getByLabelText('Employee role'),
      'Engineering'
    );
    await user.type(screen.getByLabelText(/department/i), '  Engineering  ');
    await user.selectOptions(
      screen.getByLabelText(/onboarding template/i),
      'template-1'
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeName: 'John Doe',
          employeeEmail: 'john@example.com',
          department: 'Engineering',
        })
      );
    });
  });
});
