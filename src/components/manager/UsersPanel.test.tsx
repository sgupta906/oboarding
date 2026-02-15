/**
 * UsersPanel Component Tests
 * Tests for onboarding status display, filter toggle, and enhanced delete confirmation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { UsersPanel } from './UsersPanel';
import type { User, OnboardingInstance } from '../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Smith',
    roles: ['employee'],
    profiles: ['Engineering'],
    createdAt: 1701532800000,
    updatedAt: 1701532800000,
    createdBy: 'system',
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    name: 'Bob Johnson',
    roles: ['employee'],
    profiles: [],
    createdAt: 1701619200000,
    updatedAt: 1701619200000,
    createdBy: 'system',
  },
  {
    id: 'user-3',
    email: 'charlie@example.com',
    name: 'Charlie Admin',
    roles: ['admin'],
    profiles: [],
    createdAt: 1701705600000,
    updatedAt: 1701705600000,
    createdBy: 'system',
  },
];

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
];

const mockRemoveUser = vi.fn().mockResolvedValue(undefined);
const mockCreateNewUser = vi.fn().mockResolvedValue(mockUsers[0]);
const mockEditUser = vi.fn().mockResolvedValue(undefined);

vi.mock('../../hooks/useUsers', () => ({
  useUsers: () => ({
    users: mockUsers,
    isLoading: false,
    error: null,
    createNewUser: mockCreateNewUser,
    editUser: mockEditUser,
    removeUser: mockRemoveUser,
    fetchUser: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('../../hooks', () => ({
  useRoles: () => ({
    roles: [],
    isLoading: false,
    error: null,
  }),
  useOnboardingInstances: () => ({
    data: mockInstances,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../config/authContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-manager-uid', email: 'mgr@example.com', role: 'manager' },
    role: 'manager',
    loading: false,
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

vi.mock('../../services/supabase', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

describe('UsersPanel - Onboarding Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Onboarding Status Display', () => {
    it('renders onboarding status badges in employee table', () => {
      render(<UsersPanel />);

      // Alice has an active instance, should show "Active" badge
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders progress percentage for onboarding users', () => {
      render(<UsersPanel />);

      // Alice has 45% progress
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('shows "No onboarding" text for users without instances', () => {
      render(<UsersPanel />);

      // Bob has no instance, should show dash or "No onboarding"
      const noOnboardingElements = screen.getAllByText('-');
      expect(noOnboardingElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Filter Toggle', () => {
    it('filter toggle shows only users with active onboarding', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Both Alice and Bob should be visible initially
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // Click the "Currently Onboarding" filter button
      const onboardingFilter = screen.getByRole('button', { name: /currently onboarding/i });
      await user.click(onboardingFilter);

      // Only Alice should be visible (she has an active instance)
      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Delete Confirmation', () => {
    it('delete confirmation message warns about onboarding data for onboarding user', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Click delete for Alice (who has onboarding data)
      const deleteButton = screen.getByLabelText('Delete user Alice Smith');
      await user.click(deleteButton);

      await waitFor(() => {
        // Should see enhanced warning about onboarding data
        expect(screen.getByText(/onboarding data/i)).toBeInTheDocument();
        expect(screen.getByText(/1 onboarding instance/i)).toBeInTheDocument();
      });
    });

    it('delete confirmation uses standard message for non-onboarding user', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Click delete for Bob (who has no onboarding data)
      const deleteButton = screen.getByLabelText('Delete user Bob Johnson');
      await user.click(deleteButton);

      await waitFor(() => {
        // Should see standard message without onboarding warning
        expect(screen.getByText(/Are you sure you want to delete Bob Johnson/)).toBeInTheDocument();
        expect(screen.queryByText(/onboarding data/i)).not.toBeInTheDocument();
      });
    });
  });
});
