/**
 * Unit tests for CreateOnboardingModal component
 * Tests form validation, template loading, submission, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateOnboardingModal } from './CreateOnboardingModal';
import { useTemplates, useRoles } from '../../hooks';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useTemplates: vi.fn(),
  useRoles: vi.fn(),
}));

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
    (useTemplates as any).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    (useRoles as any).mockReturnValue({
      roles: mockRoles,
      isLoading: false,
      error: null,
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      refetch: vi.fn(),
    });
  });

  // ============================================================================
  // Test 1: Visibility Tests
  // ============================================================================

  it('should not render when isOpen is false', () => {
    render(
      <CreateOnboardingModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText('Create New Onboarding')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Create New Onboarding')).toBeInTheDocument();
  });

  // ============================================================================
  // Test 2: Form Fields Rendering
  // ============================================================================

  it('should render all form fields', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText(/employee name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/onboarding template/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it('should render role dropdown with available roles', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const roleSelect = screen.getByLabelText(/^role/i) as HTMLSelectElement;
    expect(roleSelect).toHaveProperty('value', '');

    const options = Array.from(roleSelect.options).map((o) => o.value);
    expect(options).toContain('Engineering');
    expect(options).toContain('Sales');
    expect(options).toContain('Product');
    expect(options).toContain('HR');
  });

  it('should render template dropdown with available templates', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const templateSelect = screen.getByLabelText(
      /onboarding template/i
    ) as HTMLSelectElement;
    const options = Array.from(templateSelect.options).map((o) => o.value);

    expect(options).toContain('template-1');
    expect(options).toContain('template-2');
  });

  // ============================================================================
  // Test 3: Form Submission - Validation Errors
  // ============================================================================

  it('should show validation error for missing employee name', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText(/^role/i),
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
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText(/^role/i),
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
  // Test 4: Successful Submission
  // ============================================================================

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText(/^role/i),
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
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.selectOptions(
      screen.getByLabelText(/^role/i),
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
  // Test 5: Template Preview
  // ============================================================================

  it('should display template preview when template is selected', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.selectOptions(
      screen.getByLabelText(/onboarding template/i),
      'template-1'
    );

    expect(screen.getByText(/template preview/i)).toBeInTheDocument();
    // Check for the preview section specifically
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

    (useTemplates as any).mockReturnValue({
      data: [largeTemplate],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
  // Test 6: Loading and Error States
  // ============================================================================

  it('should show loading message when templates are loading', () => {
    (useTemplates as any).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/loading templates/i)).toBeInTheDocument();
  });

  it('should show error message when no templates are available', () => {
    (useTemplates as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(
      screen.getByText(/no templates available/i)
    ).toBeInTheDocument();
  });

  it('should disable submit button when templates are loading', () => {
    (useTemplates as any).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when no templates available', () => {
    (useTemplates as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('should display server error message', () => {
    const errorMessage = 'Failed to create onboarding instance';
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  // ============================================================================
  // Test 7: Loading State During Submission
  // ============================================================================

  it('should show loading spinner during submission', async () => {
    const slowSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        })
    );

    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={slowSubmit}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /creating/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('should disable all form inputs during submission', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    expect(
      screen.getByLabelText(/employee name/i)
    ).toBeDisabled();
    expect(
      screen.getByLabelText(/email address/i)
    ).toBeDisabled();
    expect(
      screen.getByLabelText(/^role/i)
    ).toBeDisabled();
    expect(
      screen.getByLabelText(/department/i)
    ).toBeDisabled();
  });

  // ============================================================================
  // Test 8: Modal Controls
  // ============================================================================

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should trim whitespace from form inputs', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText(/employee name/i), '  John Doe  ');
    await user.type(
      screen.getByLabelText(/email address/i),
      '  john@example.com  '
    );
    await user.selectOptions(
      screen.getByLabelText(/^role/i),
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

  // ============================================================================
  // Test 9: Accessibility
  // ============================================================================

  it('should have proper ARIA labels and descriptions', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(
      screen.getByLabelText(/employee name/i)
    ).toHaveAttribute('aria-required', 'true');
    expect(
      screen.getByLabelText(/email address/i)
    ).toHaveAttribute('aria-required', 'true');
    expect(
      screen.getByLabelText(/^role/i)
    ).toHaveAttribute('aria-required', 'true');
  });

  it('should associate error messages with form fields', async () => {
    const user = userEvent.setup();
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /create onboarding/i,
    });
    await user.click(submitButton);

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('aria-describedby');
  });

  // ============================================================================
  // Test 10: Required Field Indicators
  // ============================================================================

  it('should display required field indicators', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Check for red asterisk indicators on required fields
    const labels = screen.getAllByText('*');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should mark optional fields correctly', () => {
    render(
      <CreateOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Start Date field should be marked as Optional
    expect(
      screen.getByText(/start date/i).parentElement?.textContent
    ).toMatch(/optional/i);
  });
});
