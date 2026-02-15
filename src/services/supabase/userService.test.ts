/**
 * userService Tests - Verify deleteUser cleans up onboarding instances
 * Tests that deleteUser queries onboarding_instances by employee email
 * and deletes them before removing the user row.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock: supabase client
// ---------------------------------------------------------------------------

// Track calls per table for assertions
const mockDeleteEq = vi.fn();
const mockDeleteIn = vi.fn();
const mockSelectEq = vi.fn();

let usersSelectResult: any;
let instancesSelectResult: any;
let instancesDeleteResult: any;
let usersDeleteResult: any;

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => usersSelectResult),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn((...args: any[]) => {
              mockDeleteEq(table, ...args);
              return usersDeleteResult;
            }),
          })),
        };
      }
      if (table === 'onboarding_instances') {
        return {
          select: vi.fn(() => ({
            ilike: vi.fn((...args: any[]) => {
              mockSelectEq(table, ...args);
              return instancesSelectResult;
            }),
          })),
          delete: vi.fn(() => ({
            in: vi.fn((...args: any[]) => {
              mockDeleteIn(table, ...args);
              return instancesDeleteResult;
            }),
          })),
        };
      }
      return {};
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../utils/debounce', () => ({
  debounce: vi.fn((fn: any) => {
    const debounced = (...args: any[]) => fn(...args);
    debounced.cancel = vi.fn();
    return debounced;
  }),
}));

vi.mock('./subscriptionManager', () => ({
  createSharedSubscription: vi.fn((_key: string, subscribeFn: any) => ({
    subscribe: (callback: any) => {
      return subscribeFn(callback);
    },
  })),
}));

import { deleteUser } from './userService';

describe('deleteUser - onboarding instance cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user exists, no errors
    usersSelectResult = {
      data: {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'system',
        user_roles: [{ role_name: 'employee' }],
        user_profiles: [],
      },
      error: null,
    };
    usersDeleteResult = { error: null };
    instancesSelectResult = { data: [], error: null };
    instancesDeleteResult = { error: null };
  });

  it('queries onboarding_instances by employee email before deleting user', async () => {
    instancesSelectResult = { data: [], error: null };

    await deleteUser('user-1');

    // Verify instances were queried by email (case-insensitive via ilike)
    expect(mockSelectEq).toHaveBeenCalledWith(
      'onboarding_instances',
      'employee_email',
      'alice@example.com'
    );
    // Verify user row was still deleted
    expect(mockDeleteEq).toHaveBeenCalledWith('users', 'id', 'user-1');
  });

  it('deletes found instances then deletes user row', async () => {
    instancesSelectResult = {
      data: [{ id: 'inst-1' }],
      error: null,
    };

    await deleteUser('user-1');

    // Verify instance was deleted by ID
    expect(mockDeleteIn).toHaveBeenCalledWith(
      'onboarding_instances',
      'id',
      ['inst-1']
    );
    // Verify user row was deleted after instances
    expect(mockDeleteEq).toHaveBeenCalledWith('users', 'id', 'user-1');
  });

  it('handles user with no onboarding instances', async () => {
    instancesSelectResult = { data: [], error: null };

    await deleteUser('user-1');

    // No instance delete should be called
    expect(mockDeleteIn).not.toHaveBeenCalled();
    // User row should still be deleted
    expect(mockDeleteEq).toHaveBeenCalledWith('users', 'id', 'user-1');
  });

  it('handles user with multiple instances', async () => {
    instancesSelectResult = {
      data: [{ id: 'inst-1' }, { id: 'inst-2' }, { id: 'inst-3' }],
      error: null,
    };

    await deleteUser('user-1');

    // All instance IDs should be passed to the delete
    expect(mockDeleteIn).toHaveBeenCalledWith(
      'onboarding_instances',
      'id',
      ['inst-1', 'inst-2', 'inst-3']
    );
  });

  it('returns early (idempotent) when user not found', async () => {
    usersSelectResult = { data: null, error: { code: 'PGRST116', message: 'not found' } };

    await deleteUser('nonexistent-user');

    // Neither instances nor user delete should be called
    expect(mockSelectEq).not.toHaveBeenCalled();
    expect(mockDeleteEq).not.toHaveBeenCalled();
    expect(mockDeleteIn).not.toHaveBeenCalled();
  });

  it('throws when instance deletion fails', async () => {
    instancesSelectResult = {
      data: [{ id: 'inst-1' }],
      error: null,
    };
    instancesDeleteResult = {
      error: { message: 'Foreign key constraint violation' },
    };

    await expect(deleteUser('user-1')).rejects.toThrow(
      'Failed to delete onboarding instances'
    );

    // User row should NOT have been deleted since instance cleanup failed
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });
});
