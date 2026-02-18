/**
 * NewHiresPanel Component Tests
 * Tests for read-only onboarding instances table with status filter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { NewHiresPanel } from './NewHiresPanel';
import type { OnboardingInstance } from '../../types';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockInstances: OnboardingInstance[] = [
  {
    id: 'inst-1',
    employeeName: 'Alice Smith',
    employeeEmail: 'alice@example.com',
    role: 'Engineering',
    department: 'Tech',
    templateId: 'tmpl-1',
    steps: [],
    createdAt: 1701532800000,
    startDate: 1701532800000,
    progress: 45,
    status: 'active',
  },
  {
    id: 'inst-2',
    employeeName: 'Bob Johnson',
    employeeEmail: 'bob@example.com',
    role: 'Design',
    department: 'Product',
    templateId: 'tmpl-2',
    steps: [],
    createdAt: 1701619200000,
    startDate: 1701619200000,
    progress: 100,
    status: 'completed',
  },
  {
    id: 'inst-3',
    employeeName: 'Charlie Brown',
    employeeEmail: 'charlie@example.com',
    role: 'Sales',
    department: 'Revenue',
    templateId: 'tmpl-3',
    steps: [],
    createdAt: 1701705600000,
    startDate: 1701705600000,
    progress: 20,
    status: 'on_hold',
  },
];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRemoveInstance = vi.fn();
const mockUpdateInstance = vi.fn();
const mockLogActivity = vi.fn();

let mockReturn: {
  data: OnboardingInstance[];
  isLoading: boolean;
  error: Error | null;
  removeInstance: ReturnType<typeof vi.fn>;
  updateInstance: ReturnType<typeof vi.fn>;
} = {
  data: mockInstances,
  isLoading: false,
  error: null,
  removeInstance: mockRemoveInstance,
  updateInstance: mockUpdateInstance,
};

let mockUsers = [
  { id: 'u-1', email: 'alice@company.com', name: 'Alice Manager', roles: ['manager'], createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
] as Array<{ id: string; email: string; name: string; roles: string[]; createdAt: number; updatedAt: number; createdBy: string }>;

vi.mock('../../hooks', () => ({
  useOnboardingInstances: () => mockReturn,
  useRoles: () => ({
    roles: [
      { id: 'role-1', name: 'Engineering', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
      { id: 'role-2', name: 'Sales', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
    ],
    isLoading: false,
    error: null,
  }),
  useTemplates: () => ({
    data: [
      { id: 'tmpl-1', name: 'Engineer Onboarding', description: 'For engineers', role: 'Engineering', steps: [], createdAt: Date.now(), isActive: true },
      { id: 'tmpl-2', name: 'Sales Onboarding', description: 'For sales', role: 'Sales', steps: [], createdAt: Date.now(), isActive: true },
    ],
    isLoading: false,
    error: null,
  }),
  useUsers: () => ({
    users: mockUsers,
    isLoading: false,
    error: null,
    createNewUser: vi.fn(),
    editUser: vi.fn(),
    removeUser: vi.fn(),
    fetchUser: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('../../config/authContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-manager', email: 'manager@example.com', role: 'manager' },
    role: 'manager',
    loading: false,
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

vi.mock('../../services/supabase', () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
  createOnboardingRunFromTemplate: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../services/authService', () => ({
  setUserRole: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NewHiresPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoveInstance.mockResolvedValue(undefined);
    mockUpdateInstance.mockResolvedValue(undefined);
    mockLogActivity.mockResolvedValue(undefined);
    mockReturn = {
      data: mockInstances,
      isLoading: false,
      error: null,
      removeInstance: mockRemoveInstance,
      updateInstance: mockUpdateInstance,
    };
    // Reset to all users having roles (no unassigned)
    mockUsers = [
      { id: 'u-1', email: 'alice@company.com', name: 'Alice Manager', roles: ['manager'], createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
    ];
  });

  // ---- Rendering Tests ----

  describe('Rendering', () => {
    it('renders table with instance data', () => {
      render(<NewHiresPanel />);

      // Check all employee names
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();

      // Check emails
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();

      // Check departments
      expect(screen.getByText('Tech')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();

      // Check column headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
    });

    it('renders ProgressBar for each instance', () => {
      render(<NewHiresPanel />);

      // Each instance should have a progressbar
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);

      // Check values
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '45');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '100');
      expect(progressBars[2]).toHaveAttribute('aria-valuenow', '20');
    });

    it('renders correct status badge text', () => {
      render(<NewHiresPanel />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('On Hold')).toBeInTheDocument();
    });
  });

  // ---- Filter Tests ----

  describe('Filtering', () => {
    it('shows all instances by default', () => {
      render(<NewHiresPanel />);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('filters to only active instances when Active filter clicked', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /active/i }));

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
    });

    it('filters to only completed instances when Completed filter clicked', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
    });

    it('filters to only on_hold instances when On Hold filter clicked', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /on hold/i }));

      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('filter buttons display correct counts', () => {
      render(<NewHiresPanel />);

      // All should show total count
      expect(screen.getByRole('button', { name: /all/i })).toHaveTextContent('3');
      // Each status should show its count
      expect(screen.getByRole('button', { name: /active/i })).toHaveTextContent('1');
      expect(screen.getByRole('button', { name: /completed/i })).toHaveTextContent('1');
      expect(screen.getByRole('button', { name: /on hold/i })).toHaveTextContent('1');
    });
  });

  // ---- State Tests ----

  describe('States', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockReturn = { data: [], isLoading: true, error: null, removeInstance: mockRemoveInstance, updateInstance: mockUpdateInstance };
      render(<NewHiresPanel />);

      expect(screen.getByText('Loading onboarding data...')).toBeInTheDocument();
    });

    it('shows error message when error is present', () => {
      mockReturn = { data: [], isLoading: false, error: new Error('Failed to fetch'), removeInstance: mockRemoveInstance, updateInstance: mockUpdateInstance };
      render(<NewHiresPanel />);

      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('shows empty state when no instances', () => {
      mockReturn = { data: [], isLoading: false, error: null, removeInstance: mockRemoveInstance, updateInstance: mockUpdateInstance };
      render(<NewHiresPanel />);

      expect(screen.getByText(/no new hires/i)).toBeInTheDocument();
    });

    it('shows filtered empty state when filter yields no results', async () => {
      // Only active instances, then filter to completed
      mockReturn = {
        data: [mockInstances[0]], // Only Alice (active)
        isLoading: false,
        error: null,
        removeInstance: mockRemoveInstance,
        updateInstance: mockUpdateInstance,
      };
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(screen.getByText(/no completed new hires/i)).toBeInTheDocument();
    });
  });

  // ---- Delete Tests ----

  describe('Delete', () => {
    it('renders delete button for each row', () => {
      render(<NewHiresPanel />);

      expect(
        screen.getByRole('button', { name: /delete onboarding for alice smith/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete onboarding for bob johnson/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete onboarding for charlie brown/i })
      ).toBeInTheDocument();
    });

    it('renders Actions column header', () => {
      render(<NewHiresPanel />);

      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('opens confirmation dialog on delete button click', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(
        screen.getByRole('button', { name: /delete onboarding for alice smith/i })
      );

      // Dialog should be visible with the employee name
      expect(screen.getByText('Delete Onboarding Instance')).toBeInTheDocument();
      expect(screen.getByText(/alice smith/i, { selector: '#dialog-description' })).toBeInTheDocument();
    });

    it('calls removeInstance on confirm and shows success toast', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      // Open the dialog
      await user.click(
        screen.getByRole('button', { name: /delete onboarding for alice smith/i })
      );

      // Click confirm
      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(mockRemoveInstance).toHaveBeenCalledWith('inst-1');
      expect(screen.getByText('Onboarding instance deleted successfully')).toBeInTheDocument();
    });

    it('closes dialog on cancel without calling removeInstance', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      // Open the dialog
      await user.click(
        screen.getByRole('button', { name: /delete onboarding for alice smith/i })
      );

      // Verify dialog is open
      expect(screen.getByText('Delete Onboarding Instance')).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByRole('button', { name: /^cancel$/i }));

      // Dialog should be closed
      expect(screen.queryByText('Delete Onboarding Instance')).not.toBeInTheDocument();
      // removeInstance should NOT have been called
      expect(mockRemoveInstance).not.toHaveBeenCalled();
    });
  });

  // ---- Edit Tests ----

  describe('Edit', () => {
    it('renders edit button for each row with correct aria-label', () => {
      render(<NewHiresPanel />);

      expect(
        screen.getByRole('button', { name: /edit onboarding for alice smith/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /edit onboarding for bob johnson/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /edit onboarding for charlie brown/i })
      ).toBeInTheDocument();
    });

    it('edit button is alongside delete button in Actions column', () => {
      render(<NewHiresPanel />);

      // Both edit and delete buttons should exist for Alice
      const editBtn = screen.getByRole('button', { name: /edit onboarding for alice smith/i });
      const deleteBtn = screen.getByRole('button', { name: /delete onboarding for alice smith/i });

      expect(editBtn).toBeInTheDocument();
      expect(deleteBtn).toBeInTheDocument();
    });

    it('opens edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(
        screen.getByRole('button', { name: /edit onboarding for alice smith/i })
      );

      // Edit modal should be visible
      expect(screen.getByText('Edit Onboarding')).toBeInTheDocument();
    });

    it('passes correct instance to EditHireModal', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(
        screen.getByRole('button', { name: /edit onboarding for alice smith/i })
      );

      // Modal should show the instance's pre-filled name
      expect(screen.getByLabelText(/employee name/i)).toHaveValue('Alice Smith');
    });
  });

  // ---- Unassigned Users Tests ----

  describe('Unassigned Users', () => {
    it('renders UnassignedUsersSection when unassigned users exist', () => {
      // Override mockUsers to include an unassigned user
      mockUsers = [
        { id: 'u-assigned', email: 'assigned@co.com', name: 'Assigned User', roles: ['employee'], createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'admin' },
        { id: 'u-unassigned', email: 'new@gmail.com', name: 'New Google User', roles: [], createdAt: Date.now(), updatedAt: Date.now(), createdBy: '' },
      ];

      render(<NewHiresPanel />);

      expect(screen.getByText('Unassigned Users')).toBeInTheDocument();
      expect(screen.getByText('New Google User')).toBeInTheDocument();
    });

    it('hides UnassignedUsersSection when all users have roles', () => {
      render(<NewHiresPanel />);

      // Default mockUsers all have roles, so section should not appear
      expect(screen.queryByText('Unassigned Users')).not.toBeInTheDocument();
    });
  });
});
