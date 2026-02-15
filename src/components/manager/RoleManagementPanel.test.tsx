/**
 * RoleManagementPanel Component Tests
 * Tests for search/filter, edit modal, delete confirmation, and UID tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { RoleManagementPanel } from './RoleManagementPanel';
import * as rolesHook from '../../hooks/useRoles';
import type { CustomRole } from '../../types';

// Mock the useRoles hook
vi.mock('../../hooks/useRoles');

// Mock the useAuth hook
vi.mock('../../config/authContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-manager-uid', email: 'test-manager@example.com', role: 'manager' },
    role: 'manager',
    loading: false,
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

const mockRoles: CustomRole[] = [
  {
    id: '1',
    name: 'Senior Developer',
    description: 'Experienced full-stack developer',
    createdAt: 1701532800000,
    updatedAt: 1701532800000,
    createdBy: 'system',
  },
  {
    id: '2',
    name: 'Product Manager',
    description: 'Strategic product leadership',
    createdAt: 1701619200000,
    updatedAt: 1701619200000,
    createdBy: 'system',
  },
  {
    id: '3',
    name: 'Designer',
    description: undefined,
    createdAt: 1701705600000,
    updatedAt: 1701705600000,
    createdBy: 'system',
  },
];

const mockUseRoles = {
  roles: mockRoles,
  isLoading: false,
  error: null,
  createRole: vi.fn().mockResolvedValue(mockRoles[0]),
  updateRole: vi.fn().mockResolvedValue(undefined),
  deleteRole: vi.fn().mockResolvedValue(undefined),
  refetch: vi.fn(),
};

describe('RoleManagementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rolesHook.useRoles).mockReturnValue(mockUseRoles);
  });

  describe('Search and Filter Functionality', () => {
    it('filters roles by name when searching', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const searchInput = screen.getByPlaceholderText(
        'Search roles by name or description...'
      );
      await user.type(searchInput, 'Senior');

      const table = screen.getByRole('table');
      expect(within(table).getByText('Senior Developer')).toBeInTheDocument();
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    });

    it('filters roles by description when searching', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const searchInput = screen.getByPlaceholderText(
        'Search roles by name or description...'
      );
      await user.type(searchInput, 'leadership');

      const table = screen.getByRole('table');
      expect(within(table).getByText('Product Manager')).toBeInTheDocument();
      expect(screen.queryByText('Senior Developer')).not.toBeInTheDocument();
    });

    it('shows empty search results message when no matches found', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const searchInput = screen.getByPlaceholderText(
        'Search roles by name or description...'
      );
      await user.type(searchInput, 'NonExistentRole');

      expect(screen.getByText('No roles match your search')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears search when clicking clear button', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const searchInput = screen.getByPlaceholderText(
        'Search roles by name or description...'
      );
      await user.type(searchInput, 'NonExistentRole');

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      const table = screen.getByRole('table');
      mockRoles.forEach((role) => {
        expect(within(table).getByText(role.name)).toBeInTheDocument();
      });
    });

    it('performs case-insensitive search', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const searchInput = screen.getByPlaceholderText(
        'Search roles by name or description...'
      );
      await user.type(searchInput, 'SENIOR');

      const table = screen.getByRole('table');
      expect(within(table).getByText('Senior Developer')).toBeInTheDocument();
    });
  });

  describe('Edit Modal', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const editButtons = screen.getAllByLabelText(`Edit role ${mockRoles[0].name}`);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(`Edit Role: ${mockRoles[0].name}`)).toBeInTheDocument();
      });
    });

    it('pre-fills edit modal with current role data', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const editButtons = screen.getAllByLabelText(`Edit role ${mockRoles[0].name}`);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockRoles[0].name)).toBeInTheDocument();
        expect(
          screen.getByDisplayValue(mockRoles[0].description || '')
        ).toBeInTheDocument();
      });
    });

    it('closes edit modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const editButtons = screen.getAllByLabelText(`Edit role ${mockRoles[0].name}`);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText(`Edit Role: ${mockRoles[0].name}`)
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByLabelText('Cancel editing role');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText(`Edit Role: ${mockRoles[0].name}`)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Confirmation', () => {
    it('shows delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const deleteButtons = screen.getAllByLabelText(`Delete role ${mockRoles[0].name}`);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Role')).toBeInTheDocument();
        const dialog = screen.getByText('Delete Role').closest('[role="dialog"], div');
        if (dialog) {
          expect(dialog.textContent).toContain(mockRoles[0].name);
        } else {
          expect(document.body.textContent).toContain(mockRoles[0].name);
        }
      });
    });

    it('calls deleteRole when confirming deletion', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const deleteButtons = screen.getAllByLabelText(`Delete role ${mockRoles[0].name}`);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Role')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockUseRoles.deleteRole).toHaveBeenCalledWith(mockRoles[0].id);
      });
    });

    it('closes delete dialog when canceling', async () => {
      const user = userEvent.setup();
      render(<RoleManagementPanel />);

      const deleteButtons = screen.getAllByLabelText(`Delete role ${mockRoles[0].name}`);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Role')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Role')).not.toBeInTheDocument();
      });
    });
  });

  describe('User ID Tracking', () => {
    it('passes auth user uid to useRoles hook', () => {
      render(<RoleManagementPanel />);

      expect(rolesHook.useRoles).toHaveBeenCalledWith('test-manager-uid');
    });
  });
});
