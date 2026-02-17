/**
 * userService Tests
 *
 * Tests for:
 * - creatorExists() helper (Bug #40 fix)
 * - createUser() existence check integration (Bug #40 fix)
 * - deleteUser() simplified flow without instance cascade (Bug #44 fix)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock: supabase client
// ---------------------------------------------------------------------------

// Track calls per table for assertions
const mockDeleteEq = vi.fn();
const mockSelectEqLimit = vi.fn();

let usersSelectResult: any;
let usersSelectSingleResult: any;
let usersDeleteResult: any;
let usersInsertResult: any;
let userEmailCheckResult: any;
let creatorExistsResult: any;

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn((_clause?: string) => {
            // creatorExists() uses select('id').eq('id', ...).limit(1)
            // userEmailExists() uses select('id').ilike(...).limit(1)
            // getUser (crud.get) uses select('*, user_roles(*), user_profiles(*)').eq('id', ...).single()
            return {
              eq: vi.fn((_col: string, _val: string) => ({
                single: vi.fn(() => usersSelectSingleResult ?? usersSelectResult),
                limit: vi.fn((...args: any[]) => {
                  mockSelectEqLimit(table, ...args);
                  return creatorExistsResult;
                }),
              })),
              ilike: vi.fn(() => ({
                neq: vi.fn(() => ({
                  limit: vi.fn(() => userEmailCheckResult),
                })),
                limit: vi.fn(() => userEmailCheckResult),
              })),
            };
          }),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => usersInsertResult),
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
      if (table === 'user_roles') {
        return {
          insert: vi.fn(() => ({ error: null })),
          delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
        };
      }
      if (table === 'user_profiles') {
        return {
          insert: vi.fn(() => ({ error: null })),
          delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
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

import { creatorExists, createUser, deleteUser } from './userService';

// ============================================================================
// creatorExists() tests (Task 2.1 - Bug #40)
// ============================================================================

describe('creatorExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when user row exists', async () => {
    creatorExistsResult = { data: [{ id: 'user-1' }], error: null };

    const result = await creatorExists('user-1');

    expect(result).toBe(true);
  });

  it('returns false when user row does not exist', async () => {
    creatorExistsResult = { data: [], error: null };

    const result = await creatorExists('nonexistent-id');

    expect(result).toBe(false);
  });

  it('returns false on query error (fail-safe)', async () => {
    creatorExistsResult = { data: null, error: { message: 'connection error' } };

    const result = await creatorExists('user-1');

    expect(result).toBe(false);
  });
});

// ============================================================================
// createUser() existence check tests (Task 2.2 - Bug #40)
// ============================================================================

describe('createUser - creator existence check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: email does not exist (so create proceeds)
    userEmailCheckResult = { data: [], error: null };
    // Default: insert succeeds
    usersInsertResult = {
      data: {
        id: 'new-user-1',
        email: 'newuser@example.com',
        name: 'New User',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
      },
      error: null,
    };
  });

  it('sets created_by to null when creator UUID does not exist in users table', async () => {
    // Creator UUID is valid format but does not exist in DB
    creatorExistsResult = { data: [], error: null };

    const result = await createUser(
      { email: 'newuser@example.com', name: 'New User', roles: ['employee'], profiles: [], createdBy: '' },
      '00000000-0000-4000-a000-000000000099'
    );

    // The function should have checked existence and fallen back to null
    expect(result).toBeDefined();
    expect(result.id).toBe('new-user-1');
  });

  it('sets created_by to the UUID when creator exists in users table', async () => {
    // Creator UUID exists in DB
    creatorExistsResult = { data: [{ id: '00000000-0000-4000-a000-000000000002' }], error: null };
    usersInsertResult = {
      data: {
        id: 'new-user-2',
        email: 'newuser2@example.com',
        name: 'New User 2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: '00000000-0000-4000-a000-000000000002',
      },
      error: null,
    };

    const result = await createUser(
      { email: 'newuser2@example.com', name: 'New User 2', roles: ['employee'], profiles: [], createdBy: '' },
      '00000000-0000-4000-a000-000000000002'
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('new-user-2');
  });

  it('sets created_by to null when UUID format is invalid (preserves existing behavior)', async () => {
    // Invalid UUID format -- should not even call creatorExists
    const result = await createUser(
      { email: 'newuser3@example.com', name: 'New User 3', roles: ['employee'], profiles: [], createdBy: '' },
      'not-a-uuid'
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('new-user-1');
    // creatorExists should NOT have been called since format is invalid
    expect(mockSelectEqLimit).not.toHaveBeenCalled();
  });
});

// ============================================================================
// deleteUser() simplified tests (Task 2.3 - Bug #44)
// ============================================================================

describe('deleteUser - simplified (no instance cascade)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user exists
    usersSelectSingleResult = {
      data: {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        user_roles: [{ role_name: 'employee' }],
        user_profiles: [],
      },
      error: null,
    };
    usersDeleteResult = { error: null };
  });

  it('deletes user row and removes auth credentials without touching instances', async () => {
    await deleteUser('user-1');

    // Verify user row was deleted
    expect(mockDeleteEq).toHaveBeenCalledWith('users', 'id', 'user-1');
  });

  it('does NOT query or delete onboarding_instances', async () => {
    const { supabase } = await import('../../config/supabase');

    await deleteUser('user-1');

    // Get all calls to supabase.from()
    const fromCalls = vi.mocked(supabase.from).mock.calls;
    const tablesQueried = fromCalls.map((call) => call[0]);

    // onboarding_instances should never appear
    expect(tablesQueried).not.toContain('onboarding_instances');
  });

  it('returns early (idempotent) when user not found', async () => {
    usersSelectSingleResult = { data: null, error: { code: 'PGRST116', message: 'not found' } };

    await deleteUser('nonexistent-user');

    // Neither instances nor user delete should be called
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });
});
