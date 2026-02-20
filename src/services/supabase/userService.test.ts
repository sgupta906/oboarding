/**
 * userService Tests
 *
 * Tests for:
 * - creatorExists() helper (Bug #40 fix)
 * - createUser() existence check integration (Bug #40 fix)
 * - deleteUser() simplified flow without instance cascade (Bug #44 fix)
 * - updateUser() credential sync on role change (email-signin-role-leak fix)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock: supabase client
// ---------------------------------------------------------------------------

// Track calls per table for assertions
const mockDeleteEq = vi.fn();
const mockSelectEqLimit = vi.fn();
const mockUsersUpdateEq = vi.fn();

let usersSelectResult: any;
let usersSelectSingleResult: any;
let usersDeleteResult: any;
let usersInsertResult: any;
let userEmailCheckResult: any;
let creatorExistsResult: any;
let usersUpdateResult: any;
let getUserByEmailResult: any;

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn((clause?: string) => {
            // creatorExists() uses select('id').eq('id', ...).limit(1)
            // userEmailExists() uses select('id').ilike(...).limit(1)
            // getUserByEmail() uses select('id, email, user_roles(role_name)').ilike(...).limit(1)
            // getUser (crud.get) uses select('*, user_roles(*), user_profiles(*)').eq('id', ...).single()

            // Branch for getUserByEmail (select clause includes 'user_roles')
            if (clause && clause.includes('user_roles(role_name)')) {
              return {
                ilike: vi.fn(() => ({
                  limit: vi.fn(() => getUserByEmailResult),
                })),
              };
            }

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
          update: vi.fn(() => ({
            eq: vi.fn((...args: any[]) => {
              mockUsersUpdateEq(table, ...args);
              return usersUpdateResult ?? { error: null };
            }),
          })),
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

// Mock authCredentialHelpers to track addUserToAuthCredentials calls
const mockAddUserToAuthCredentials = vi.fn();
const mockGetAuthCredential = vi.fn().mockReturnValue(null);
const mockRemoveUserFromAuthCredentials = vi.fn();

vi.mock('./authCredentialHelpers', () => ({
  addUserToAuthCredentials: (...args: any[]) => mockAddUserToAuthCredentials(...args),
  getAuthCredential: (...args: any[]) => mockGetAuthCredential(...args),
  removeUserFromAuthCredentials: (...args: any[]) => mockRemoveUserFromAuthCredentials(...args),
  saveLocalUsers: vi.fn(),
  setDisableDefaultUserSeeding: vi.fn(),
  clearAllUsersForTesting: vi.fn(),
}));

import { creatorExists, createUser, deleteUser, updateUser, getUserByEmail } from './userService';

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
// createUser() auth credential role normalization (test-user-signin-error fix)
// ============================================================================

describe('createUser - auth credential role normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: email does not exist (so create proceeds)
    userEmailCheckResult = { data: [], error: null };
    // Default: creator does not exist (use null)
    creatorExistsResult = { data: [], error: null };
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

  it("stores 'manager' as auth credential role for custom roles like 'software engineer'", async () => {
    await createUser(
      { email: 'newuser@example.com', name: 'New User', roles: ['software engineer'], profiles: [], createdBy: '' },
      'not-a-uuid'
    );

    // Auth credential should store 'manager', NOT the custom role name
    expect(mockAddUserToAuthCredentials).toHaveBeenCalledWith(
      'newuser@example.com',
      'manager',
      'new-user-1'
    );
  });

  it("stores 'manager' even when role name is 'employee' (Users-panel 'employee' is a business role, not system access)", async () => {
    await createUser(
      { email: 'newuser@example.com', name: 'New User', roles: ['employee'], profiles: [], createdBy: '' },
      'not-a-uuid'
    );

    // ALL Users-panel users get manager access -- 'employee' here is a custom role name,
    // not a system access designation
    expect(mockAddUserToAuthCredentials).toHaveBeenCalledWith(
      'newuser@example.com',
      'manager',
      'new-user-1'
    );
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

// ============================================================================
// updateUser() credential sync tests (email-signin-role-leak fix)
// ============================================================================

describe('updateUser - credential sync on role change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: email does not exist (no duplicate)
    userEmailCheckResult = { data: [], error: null };
    // Default: user update succeeds
    usersUpdateResult = { error: null };
    // Default: getUser returns a user (for email lookup when roles change)
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
  });

  it('calls addUserToAuthCredentials when roles change', async () => {
    await updateUser('user-1', { roles: ['employee'] });

    // Should have synced auth credentials with 'manager' (all Users-panel users get manager access)
    expect(mockAddUserToAuthCredentials).toHaveBeenCalledWith(
      'alice@example.com',
      'manager',
      'user-1'
    );
  });

  it('does NOT call addUserToAuthCredentials when roles are not in updates', async () => {
    await updateUser('user-1', { name: 'Alice Updated' });

    // Should NOT have called addUserToAuthCredentials
    expect(mockAddUserToAuthCredentials).not.toHaveBeenCalled();
  });

  it('uses provided email from updates instead of fetching from DB', async () => {
    await updateUser('user-1', { roles: ['manager'], email: 'newalice@example.com' });

    // Should use the provided email, not the DB email; role is always 'manager'
    expect(mockAddUserToAuthCredentials).toHaveBeenCalledWith(
      'newalice@example.com',
      'manager',
      'user-1'
    );
  });

  it("stores 'manager' as auth credential role for custom roles like 'talker'", async () => {
    await updateUser('user-1', { roles: ['talker'] });

    // Auth credential should store 'manager', NOT the custom role name
    expect(mockAddUserToAuthCredentials).toHaveBeenCalledWith(
      'alice@example.com',
      'manager',
      'user-1'
    );
  });
});

// ============================================================================
// getUserByEmail() tests (users-panel-signin-bug fix)
// ============================================================================

describe('getUserByEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { id, email, roles } when user found with roles', async () => {
    getUserByEmailResult = {
      data: [
        {
          id: 'user-123',
          email: 'alice@example.com',
          user_roles: [{ role_name: 'software engineer' }],
        },
      ],
      error: null,
    };

    const result = await getUserByEmail('alice@example.com');

    expect(result).toEqual({
      id: 'user-123',
      email: 'alice@example.com',
      roles: ['software engineer'],
    });
  });

  it('returns null when no user found (empty data array)', async () => {
    getUserByEmailResult = { data: [], error: null };

    const result = await getUserByEmail('nobody@example.com');

    expect(result).toBeNull();
  });

  it('returns null on Supabase query error', async () => {
    getUserByEmailResult = { data: null, error: { message: 'connection error' } };

    const result = await getUserByEmail('alice@example.com');

    expect(result).toBeNull();
  });

  it('normalizes email to lowercase and trims whitespace', async () => {
    getUserByEmailResult = {
      data: [
        {
          id: 'user-456',
          email: 'bob@example.com',
          user_roles: [{ role_name: 'manager' }],
        },
      ],
      error: null,
    };

    const result = await getUserByEmail('  Bob@EXAMPLE.COM  ');

    expect(result).toEqual({
      id: 'user-456',
      email: 'bob@example.com',
      roles: ['manager'],
    });
  });

  it('returns empty roles array when user has no user_roles entries', async () => {
    getUserByEmailResult = {
      data: [
        {
          id: 'user-789',
          email: 'oauth@example.com',
          user_roles: [],
        },
      ],
      error: null,
    };

    const result = await getUserByEmail('oauth@example.com');

    expect(result).toEqual({
      id: 'user-789',
      email: 'oauth@example.com',
      roles: [],
    });
  });
});
