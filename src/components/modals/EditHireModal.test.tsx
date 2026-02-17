/**
 * EditHireModal Component Tests
 * Tests for editing onboarding instances: pre-fill, validation,
 * template change with step merging, form reset, submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { EditHireModal } from './EditHireModal';
import type { OnboardingInstance, CustomRole, Template, Step } from '../../types';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockSteps: Step[] = [
  {
    id: 1,
    title: 'Setup Dev Env',
    description: 'Install tools',
    role: 'All',
    owner: 'IT',
    expert: 'Admin',
    status: 'completed',
    link: '',
  },
  {
    id: 2,
    title: 'Code Review',
    description: 'Learn code review process',
    role: 'Engineering',
    owner: 'DevOps',
    expert: 'Senior',
    status: 'pending',
    link: '',
  },
  {
    id: 3,
    title: 'Meet the Team',
    description: 'Team introductions',
    role: 'All',
    owner: 'HR',
    expert: 'Manager',
    status: 'completed',
    link: '',
  },
];

const mockInstance: OnboardingInstance = {
  id: 'inst-1',
  employeeName: 'Alice Smith',
  employeeEmail: 'alice@example.com',
  role: 'Engineering',
  department: 'Tech',
  templateId: 'tmpl-1',
  steps: mockSteps,
  createdAt: 1701532800000,
  startDate: 1701532800000,
  progress: 67,
  status: 'active',
};

const mockRoles: CustomRole[] = [
  {
    id: 'role-1',
    name: 'Engineering',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin',
  },
  {
    id: 'role-2',
    name: 'Sales',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin',
  },
];

const mockTemplates: Template[] = [
  {
    id: 'tmpl-1',
    name: 'Engineer Onboarding',
    description: 'For engineers',
    role: 'Engineering',
    steps: [
      { id: 1, title: 'Setup Dev Env', description: 'Install tools', role: 'All', owner: 'IT', expert: 'Admin', status: 'pending', link: '' },
      { id: 2, title: 'Code Review', description: 'Learn code review', role: 'Engineering', owner: 'DevOps', expert: 'Senior', status: 'pending', link: '' },
      { id: 3, title: 'Meet the Team', description: 'Team introductions', role: 'All', owner: 'HR', expert: 'Manager', status: 'pending', link: '' },
    ],
    createdAt: Date.now(),
    isActive: true,
  },
  {
    id: 'tmpl-2',
    name: 'Sales Onboarding',
    description: 'For sales team',
    role: 'Sales',
    steps: [
      { id: 1, title: 'Setup Dev Env', description: 'Install tools', role: 'All', owner: 'IT', expert: 'Admin', status: 'pending', link: '' },
      { id: 2, title: 'Security Training', description: 'Complete security course', role: 'All', owner: 'Security', expert: 'CISO', status: 'pending', link: '' },
      { id: 3, title: 'Code Review', description: 'Learn code review', role: 'Engineering', owner: 'DevOps', expert: 'Senior', status: 'pending', link: '' },
      { id: 4, title: 'Deploy Pipeline', description: 'Learn CI/CD', role: 'Engineering', owner: 'DevOps', expert: 'Lead', status: 'pending', link: '' },
    ],
    createdAt: Date.now(),
    isActive: true,
  },
];

// Full template with steps for the "new" template (tmpl-2)
const mockNewTemplate: Template = mockTemplates[1];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetTemplate = vi.fn();
const mockLogActivity = vi.fn();

vi.mock('../../services/supabase', () => ({
  getTemplate: (...args: unknown[]) => mockGetTemplate(...args),
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EditHireModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
    mockGetTemplate.mockResolvedValue(mockNewTemplate);
    mockLogActivity.mockResolvedValue(undefined);
  });

  const renderModal = (overrides: Partial<Parameters<typeof EditHireModal>[0]> = {}) =>
    render(
      <EditHireModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        instance={mockInstance}
        roles={mockRoles}
        templates={mockTemplates}
        {...overrides}
      />
    );

  // ---- Pre-fill Tests ----

  describe('Pre-fill', () => {
    it('pre-fills form fields from instance prop', () => {
      renderModal();

      expect(screen.getByLabelText(/employee name/i)).toHaveValue('Alice Smith');
      expect(screen.getByLabelText(/employee email/i)).toHaveValue('alice@example.com');
      expect(screen.getByLabelText(/employee role/i)).toHaveValue('Engineering');
      expect(screen.getByLabelText(/employee department/i)).toHaveValue('Tech');
    });

    it('shows current template selected in dropdown', () => {
      renderModal();

      expect(screen.getByLabelText(/onboarding template/i)).toHaveValue('tmpl-1');
    });
  });

  // ---- Validation Tests ----

  describe('Validation', () => {
    it('shows validation error for empty employee name', async () => {
      const user = userEvent.setup();
      renderModal();

      // Clear the name field
      const nameInput = screen.getByLabelText(/employee name/i);
      await user.clear(nameInput);

      // Click submit
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(screen.getByText(/employee name is required/i)).toBeInTheDocument();
    });

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();
      renderModal();

      const emailInput = screen.getByLabelText(/employee email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'not-an-email');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });

    it('shows validation error for empty role', async () => {
      const user = userEvent.setup();
      renderModal();

      const roleSelect = screen.getByLabelText(/employee role/i);
      await user.selectOptions(roleSelect, '');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(screen.getByText(/role is required/i)).toBeInTheDocument();
    });

    it('shows validation error for empty department', async () => {
      const user = userEvent.setup();
      renderModal();

      const deptInput = screen.getByLabelText(/employee department/i);
      await user.clear(deptInput);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(screen.getByText(/department is required/i)).toBeInTheDocument();
    });
  });

  // ---- Template Change Tests ----

  describe('Template Change', () => {
    it('shows template change warning when different template selected', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByLabelText(/onboarding template/i);
      await user.selectOptions(templateSelect, 'tmpl-2');

      expect(screen.getByText(/will reset step progress/i)).toBeInTheDocument();
    });

    it('does NOT show warning when template unchanged', () => {
      renderModal();

      expect(screen.queryByText(/will reset step progress/i)).not.toBeInTheDocument();
    });

    it('displays template preview when template selected', () => {
      renderModal();

      expect(screen.getByText(/template preview/i)).toBeInTheDocument();
      // The preview section contains the template name in a <strong> tag
      const previewSection = screen.getByText(/template preview/i).closest('div');
      expect(previewSection).toBeInTheDocument();
    });
  });

  // ---- Submission Tests ----

  describe('Submission', () => {
    it('submits with correct data when no template change', async () => {
      const user = userEvent.setup();
      renderModal();

      // Change just the department
      const deptInput = screen.getByLabelText(/employee department/i);
      await user.clear(deptInput);
      await user.type(deptInput, 'Product');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          'inst-1',
          expect.objectContaining({
            department: 'Product',
          })
        );
      });
    });

    it('submits with merged steps when template changes', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByLabelText(/onboarding template/i);
      await user.selectOptions(templateSelect, 'tmpl-2');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          'inst-1',
          expect.objectContaining({
            templateId: 'tmpl-2',
            steps: expect.any(Array),
            progress: expect.any(Number),
          })
        );
      });
    });

    it('preserves completed step status via title match', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByLabelText(/onboarding template/i);
      await user.selectOptions(templateSelect, 'tmpl-2');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const [, updates] = mockOnSubmit.mock.calls[0];
        const mergedSteps = updates.steps as Step[];

        // "Setup Dev Env" was completed in original -- should be preserved
        const setupStep = mergedSteps.find((s: Step) => s.title === 'Setup Dev Env');
        expect(setupStep?.status).toBe('completed');

        // "Code Review" was pending in original -- should be preserved
        const codeReviewStep = mergedSteps.find((s: Step) => s.title === 'Code Review');
        expect(codeReviewStep?.status).toBe('pending');

        // "Security Training" is new -- should be pending
        const securityStep = mergedSteps.find((s: Step) => s.title === 'Security Training');
        expect(securityStep?.status).toBe('pending');

        // "Deploy Pipeline" is new -- should be pending
        const deployStep = mergedSteps.find((s: Step) => s.title === 'Deploy Pipeline');
        expect(deployStep?.status).toBe('pending');

        // "Meet the Team" was in original but NOT in new template -- should be dropped
        const meetStep = mergedSteps.find((s: Step) => s.title === 'Meet the Team');
        expect(meetStep).toBeUndefined();
      });
    });

    it('new steps from template get pending status', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByLabelText(/onboarding template/i);
      await user.selectOptions(templateSelect, 'tmpl-2');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const [, updates] = mockOnSubmit.mock.calls[0];
        const mergedSteps = updates.steps as Step[];

        // All new steps should be pending
        const securityStep = mergedSteps.find((s: Step) => s.title === 'Security Training');
        const deployStep = mergedSteps.find((s: Step) => s.title === 'Deploy Pipeline');
        expect(securityStep?.status).toBe('pending');
        expect(deployStep?.status).toBe('pending');
      });
    });
  });

  // ---- Reset Tests ----

  describe('Reset', () => {
    it('resets form when modal closed and re-opened', async () => {
      const user = userEvent.setup();
      const { rerender } = renderModal();

      // Modify a field
      const deptInput = screen.getByLabelText(/employee department/i);
      await user.clear(deptInput);
      await user.type(deptInput, 'Modified');

      // Close modal
      rerender(
        <EditHireModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          instance={mockInstance}
          roles={mockRoles}
          templates={mockTemplates}
        />
      );

      // Re-open modal
      rerender(
        <EditHireModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          instance={mockInstance}
          roles={mockRoles}
          templates={mockTemplates}
        />
      );

      // Department should be reset to original value
      expect(screen.getByLabelText(/employee department/i)).toHaveValue('Tech');
    });
  });

  // ---- Loading State Tests ----

  describe('Loading State', () => {
    it('shows loading spinner during submission', () => {
      renderModal({ isSubmitting: true });

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  // ---- Guard Tests ----

  describe('Guard', () => {
    it('returns null if isOpen but no instance', () => {
      render(
        <EditHireModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          instance={null}
          roles={mockRoles}
          templates={mockTemplates}
        />
      );

      // Should not render anything meaningful (no modal title)
      expect(screen.queryByText(/edit onboarding/i)).not.toBeInTheDocument();
    });
  });
});
