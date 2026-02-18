/**
 * UnassignedUsersSection Tests
 * Tests for the table of users with no assigned roles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnassignedUsersSection } from './UnassignedUsersSection';
import type { User } from '../../types';

const mockUnassignedUsers: User[] = [
  {
    id: 'user-1',
    email: 'jane@gmail.com',
    name: 'Jane Doe',
    roles: [],
    createdAt: Date.now() - 120000, // 2 minutes ago
    updatedAt: Date.now(),
    createdBy: '',
  },
  {
    id: 'user-2',
    email: 'bob@gmail.com',
    name: 'Bob Smith',
    roles: [],
    createdAt: Date.now() - 3600000, // 1 hour ago
    updatedAt: Date.now(),
    createdBy: '',
  },
];

const mockAssignedUsers: User[] = [
  {
    id: 'user-3',
    email: 'alice@company.com',
    name: 'Alice Manager',
    roles: ['manager'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin',
  },
];

describe('UnassignedUsersSection', () => {
  const mockOnAssign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table of unassigned users (users with empty roles[])', () => {
    render(
      <UnassignedUsersSection
        users={[...mockUnassignedUsers, ...mockAssignedUsers]}
        onAssign={mockOnAssign}
      />,
    );

    // Should show unassigned users
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();

    // Should NOT show assigned users
    expect(screen.queryByText('Alice Manager')).not.toBeInTheDocument();

    // Should show section heading
    expect(screen.getByText('Unassigned Users')).toBeInTheDocument();
  });

  it('renders nothing when no unassigned users exist', () => {
    const { container } = render(
      <UnassignedUsersSection
        users={mockAssignedUsers}
        onAssign={mockOnAssign}
      />,
    );

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  it('renders "Assign Role" button for each unassigned user', () => {
    render(
      <UnassignedUsersSection
        users={mockUnassignedUsers}
        onAssign={mockOnAssign}
      />,
    );

    const assignButtons = screen.getAllByRole('button', { name: /assign role/i });
    expect(assignButtons).toHaveLength(2);
  });

  it('clicking "Assign Role" calls onAssign with the user', async () => {
    const user = userEvent.setup();
    render(
      <UnassignedUsersSection
        users={mockUnassignedUsers}
        onAssign={mockOnAssign}
      />,
    );

    const assignButtons = screen.getAllByRole('button', { name: /assign role/i });
    await user.click(assignButtons[0]);

    expect(mockOnAssign).toHaveBeenCalledWith(mockUnassignedUsers[0]);
  });
});
