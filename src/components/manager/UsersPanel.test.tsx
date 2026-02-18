/**
 * UsersPanel Component Tests
 * Tests for system user CRUD table with create/edit/delete modals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersPanel } from './UsersPanel';
import type { User, CustomRole } from '../../types';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Smith',
    roles: ['Manager', 'Admin'],
    profiles: ['Engineering', 'Product'],
    createdAt: 1701532800000,
    updatedAt: 1701532800000,
    createdBy: 'system',
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    name: 'Bob Johnson',
    roles: ['Contractor'],
    profiles: [],
    createdAt: 1701619200000,
    updatedAt: 1701619200000,
    createdBy: 'system',
  },
  {
    id: 'user-3',
    email: 'charlie@example.com',
    name: 'Charlie Brown',
    roles: ['Manager'],
    profiles: ['Sales'],
    createdAt: 1701705600000,
    updatedAt: 1701705600000,
    createdBy: 'system',
  },
];

const mockRoles: CustomRole[] = [
  {
    id: 'role-1',
    name: 'Manager',
    description: 'Team manager',
    createdAt: 1701532800000,
    updatedAt: 1701532800000,
    createdBy: 'system',
  },
  {
    id: 'role-2',
    name: 'Admin',
    description: 'System admin',
    createdAt: 1701532800000,
    updatedAt: 1701532800000,
    createdBy: 'system',
  },
];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateNewUser = vi.fn().mockResolvedValue(mockUsers[0]);
const mockEditUser = vi.fn().mockResolvedValue(undefined);
const mockRemoveUser = vi.fn().mockResolvedValue(undefined);

let mockUseUsersReturn: {
  users: User[];
  isLoading: boolean;
  error: string | null;
  createNewUser: ReturnType<typeof vi.fn>;
  editUser: ReturnType<typeof vi.fn>;
  removeUser: ReturnType<typeof vi.fn>;
  fetchUser: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} = {
  users: mockUsers,
  isLoading: false,
  error: null,
  createNewUser: mockCreateNewUser,
  editUser: mockEditUser,
  removeUser: mockRemoveUser,
  fetchUser: vi.fn(),
  reset: vi.fn(),
};

vi.mock('../../hooks/useUsers', () => ({
  useUsers: () => mockUseUsersReturn,
}));

vi.mock('../../hooks/useRoles', () => ({
  useRoles: () => ({
    roles: mockRoles,
    isLoading: false,
    error: null,
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock('../../config/authContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-manager-uid', email: 'test-manager@example.com', role: 'manager' },
    role: 'manager',
    loading: false,
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

const mockLogActivity = vi.fn().mockResolvedValue(undefined);
vi.mock('../../services/supabase', () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

// Mock UserModal - render a stub that exposes onSubmit via a button.
// The onClick handler mirrors real UserModal.handleSubmit: awaits onSubmit
// in a try/catch so re-thrown errors don't become unhandled rejections.
vi.mock('../modals/UserModal', () => ({
  UserModal: ({ isOpen, onSubmit, mode, onClose, user: editUser }: {
    isOpen: boolean;
    onSubmit: (data: unknown) => Promise<void>;
    mode: string;
    onClose: () => void;
    user?: User | null;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="user-modal">
        <span data-testid="user-modal-mode">{mode}</span>
        {editUser && <span data-testid="user-modal-user">{editUser.name}</span>}
        <button
          onClick={async () => {
            try {
              await onSubmit({ email: 'new@example.com', name: 'New User', roles: ['Manager'] });
            } catch {
              // Error handling is done by parent component (mirrors real UserModal)
            }
          }}
        >
          Submit Modal
        </button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  },
}));

// Mock DeleteConfirmationDialog - render a stub that exposes onConfirm
vi.mock('../ui/DeleteConfirmationDialog', () => ({
  DeleteConfirmationDialog: ({ isOpen, onConfirm, onCancel, message }: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message: string;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="delete-dialog">
        <span data-testid="delete-dialog-message">{message}</span>
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={onCancel}>Cancel Delete</button>
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UsersPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUsersReturn = {
      users: mockUsers,
      isLoading: false,
      error: null,
      createNewUser: mockCreateNewUser,
      editUser: mockEditUser,
      removeUser: mockRemoveUser,
      fetchUser: vi.fn(),
      reset: vi.fn(),
    };
  });

  // ---- Rendering Tests ----

  describe('Rendering', () => {
    it('renders table with user data (names and emails)', () => {
      render(<UsersPanel />);

      // Check all user names
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();

      // Check all emails
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
    });

    it('renders column headers (Name, Email, Roles, Profiles, Actions)', () => {
      render(<UsersPanel />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByText('Profiles')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders role badges for each user', () => {
      render(<UsersPanel />);

      // Alice has Manager and Admin roles, Charlie also has Manager
      // So "Manager" appears twice as role badges -- use getAllByText
      const managerBadges = screen.getAllByText('Manager');
      expect(managerBadges.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Admin')).toBeInTheDocument();
      // Bob has Contractor role
      expect(screen.getByText('Contractor')).toBeInTheDocument();
    });

    it('renders "New User" button', () => {
      render(<UsersPanel />);

      expect(screen.getByRole('button', { name: /new user/i })).toBeInTheDocument();
    });
  });

  // ---- State Tests ----

  describe('States', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockUseUsersReturn = { ...mockUseUsersReturn, users: [], isLoading: true };
      render(<UsersPanel />);

      expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });

    it('shows error message when error is present', () => {
      mockUseUsersReturn = { ...mockUseUsersReturn, users: [], error: 'Failed to fetch users' };
      render(<UsersPanel />);

      expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
    });

    it('shows empty state when no users exist', () => {
      mockUseUsersReturn = { ...mockUseUsersReturn, users: [] };
      render(<UsersPanel />);

      expect(screen.getByText(/no users/i)).toBeInTheDocument();
    });
  });

  // ---- CRUD Interaction Tests ----

  describe('CRUD Interactions', () => {
    it('clicking "New User" opens create modal', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      await user.click(screen.getByRole('button', { name: /new user/i }));

      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getByTestId('user-modal-mode')).toHaveTextContent('create');
    });

    it('clicking edit button opens edit modal with user data', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      const editButtons = screen.getAllByLabelText(/edit user/i);
      await user.click(editButtons[0]);

      expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      expect(screen.getByTestId('user-modal-mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('user-modal-user')).toHaveTextContent('Alice Smith');
    });

    it('clicking delete button opens delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      const deleteButtons = screen.getAllByLabelText(/delete user/i);
      await user.click(deleteButtons[0]);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('confirming delete calls removeUser with correct user ID', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Open delete dialog for first user
      const deleteButtons = screen.getAllByLabelText(/delete user/i);
      await user.click(deleteButtons[0]);

      // Confirm the deletion
      await user.click(screen.getByText('Confirm Delete'));

      await waitFor(() => {
        expect(mockRemoveUser).toHaveBeenCalledWith('user-1');
      });
    });

    it('shows success toast after successful create operation', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Open create modal
      await user.click(screen.getByRole('button', { name: /new user/i }));

      // Submit the modal
      await user.click(screen.getByText('Submit Modal'));

      await waitFor(() => {
        expect(screen.getByText(/user created successfully/i)).toBeInTheDocument();
      });
    });
  });

  // ---- Error Handling Tests (Bugs #8, #10, #12) ----

  describe('Error Handling', () => {
    it('keeps create modal open when createNewUser rejects (Bug #8)', async () => {
      mockCreateNewUser.mockRejectedValueOnce(new Error('DB error'));
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Open create modal
      await user.click(screen.getByRole('button', { name: /new user/i }));
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();

      // Submit -- should reject
      await user.click(screen.getByText('Submit Modal'));

      // Modal should still be open (not dismissed)
      await waitFor(() => {
        expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      });
    });

    it('keeps edit modal open when editUser rejects (Bug #8)', async () => {
      mockEditUser.mockRejectedValueOnce(new Error('DB error'));
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Open edit modal for first user
      const editButtons = screen.getAllByLabelText(/edit user/i);
      await user.click(editButtons[0]);
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();

      // Submit -- should reject
      await user.click(screen.getByText('Submit Modal'));

      // Modal should still be open (not dismissed)
      await waitFor(() => {
        expect(screen.getByTestId('user-modal')).toBeInTheDocument();
      });
    });

    it('calls reset() when create modal is closed (Bug #10)', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Open create modal
      await user.click(screen.getByRole('button', { name: /new user/i }));
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByText('Close Modal'));

      expect(mockUseUsersReturn.reset).toHaveBeenCalled();
    });

    it('calls reset() when edit modal is closed (Bug #10)', async () => {
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Open edit modal for first user
      const editButtons = screen.getAllByLabelText(/edit user/i);
      await user.click(editButtons[0]);
      expect(screen.getByTestId('user-modal')).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByText('Close Modal'));

      expect(mockUseUsersReturn.reset).toHaveBeenCalled();
    });

    it('hides store error banner while create modal is open (Bug #12)', async () => {
      mockUseUsersReturn = { ...mockUseUsersReturn, users: [], error: 'Server error' };
      const user = userEvent.setup();
      render(<UsersPanel />);

      // Error banner should be visible when no modal is open
      expect(screen.getByText('Server error')).toBeInTheDocument();

      // Open create modal
      await user.click(screen.getByRole('button', { name: /new user/i }));

      // Error banner should be hidden while modal is open
      expect(screen.queryByText('Server error')).not.toBeInTheDocument();
    });
  });
});
