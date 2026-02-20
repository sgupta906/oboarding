/**
 * Auth Service Tests
 * Tests for Supabase authentication service functions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  signInWithEmailLink,
  signInWithGoogle,
  ensureUserExists,
  setUserRole,
  getUserRole,
  signOut,
} from './authService';

// Mock Supabase client - use vi.hoisted() so mocks are available when vi.mock factory runs
const {
  mockSupabaseAuth,
  mockUpsert,
  mockInsert,
  mockDeleteEq,
  mockDelete,
  mockSingle,
  mockEq,
  mockSelect,
  mockFrom,
} = vi.hoisted(() => {
  const mockSupabaseAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  };

  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
  const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        upsert: mockUpsert,
        select: mockSelect,
      };
    }
    if (table === 'user_roles') {
      return {
        delete: mockDelete,
        insert: mockInsert,
      };
    }
    return {};
  });

  return {
    mockSupabaseAuth,
    mockUpsert,
    mockInsert,
    mockDeleteEq,
    mockDelete,
    mockSingle,
    mockEq,
    mockSelect,
    mockFrom,
  };
});

vi.mock('../config/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockFrom,
  },
}));

// Mock getAuthCredential, getInstanceByEmployeeEmail, getUserByEmail, addUserToAuthCredentials from ./supabase barrel
const mockGetInstanceByEmployeeEmail = vi.fn().mockResolvedValue(null);
const mockGetUserByEmail = vi.fn().mockResolvedValue(null);
const mockAddUserToAuthCredentials = vi.fn();

vi.mock('./supabase', () => ({
  getAuthCredential: vi.fn().mockReturnValue(null),
  getInstanceByEmployeeEmail: (...args: any[]) => mockGetInstanceByEmployeeEmail(...args),
  getUserByEmail: (...args: any[]) => mockGetUserByEmail(...args),
  addUserToAuthCredentials: (...args: any[]) => mockAddUserToAuthCredentials(...args),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default return values
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockGetInstanceByEmployeeEmail.mockResolvedValue(null);
    mockGetUserByEmail.mockResolvedValue(null);
    mockAddUserToAuthCredentials.mockReset();
  });

  describe('signInWithEmailLink - Error Cases', () => {
    it('should reject invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        '',
        '   ',
      ];

      for (const email of invalidEmails) {
        await expect(signInWithEmailLink(email)).rejects.toThrow(
          'Please enter a valid email address'
        );
      }
    });

    it('should reject unrecognized email addresses', async () => {
      const unknownEmail = 'unknown-user@example.com';
      await expect(signInWithEmailLink(unknownEmail)).rejects.toThrow(
        'Email not recognized'
      );
    });

    it('should handle email with whitespace', async () => {
      // This should work - the function trims whitespace
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'test-uid', identities: [{}] } },
        error: null,
      });

      // Should not throw for email with whitespace
      await expect(
        signInWithEmailLink('  test-manager@example.com  ')
      ).resolves.not.toThrow();
    });
  });

  describe('setUserRole', () => {
    it('should upsert user row and set role in user_roles', async () => {
      await setUserRole('uid-123', 'user@example.com', 'employee');

      // Verify user upsert was called
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockUpsert).toHaveBeenCalledWith({
        id: 'uid-123',
        email: 'user@example.com',
        name: 'user',
        updated_at: expect.any(String),
      });

      // Verify old roles were deleted
      expect(mockFrom).toHaveBeenCalledWith('user_roles');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('user_id', 'uid-123');

      // Verify new role was inserted
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'uid-123',
        role_name: 'employee',
      });
    });

    it('should throw if user upsert fails', async () => {
      mockUpsert.mockResolvedValueOnce({
        error: { message: 'Upsert failed' },
      });

      await expect(
        setUserRole('uid-123', 'user@example.com', 'employee')
      ).rejects.toBeTruthy();
    });

    it('should throw if role delete fails', async () => {
      mockDeleteEq.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      await expect(
        setUserRole('uid-123', 'user@example.com', 'employee')
      ).rejects.toBeTruthy();
    });

    it('should throw if role insert fails', async () => {
      mockInsert.mockResolvedValueOnce({
        error: { message: 'Insert failed' },
      });

      await expect(
        setUserRole('uid-123', 'user@example.com', 'employee')
      ).rejects.toBeTruthy();
    });
  });

  describe('getUserRole', () => {
    it('should retrieve user role from Supabase', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'uid-123',
          email: 'user@example.com',
          user_roles: [{ role_name: 'employee' }],
        },
        error: null,
      });

      const role = await getUserRole('uid-123');

      expect(role).toBe('employee');
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*, user_roles(role_name)');
      expect(mockEq).toHaveBeenCalledWith('id', 'uid-123');
    });

    it('should return null when user document does not exist', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const role = await getUserRole('non-existent-uid');

      expect(role).toBeNull();
    });

    it('should return null when Supabase error occurs', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'UNKNOWN', message: 'Database error' },
      });

      const role = await getUserRole('uid-123');

      expect(role).toBeNull();
    });

    it('should return null when user has no roles', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'uid-123',
          email: 'user@example.com',
          user_roles: [],
        },
        error: null,
      });

      const role = await getUserRole('uid-123');

      expect(role).toBeNull();
    });

    it('should return different roles correctly', async () => {
      const testRoles: string[] = [
        'employee',
        'manager',
        'admin',
      ];

      for (const testRole of testRoles) {
        mockSingle.mockResolvedValueOnce({
          data: {
            id: 'uid-123',
            email: 'user@example.com',
            user_roles: [{ role_name: testRole }],
          },
          error: null,
        });

        const role = await getUserRole('uid-123');

        expect(role).toBe(testRole);
      }
    });
  });

  describe('signInWithEmailLink', () => {
    it('should throw error for unrecognized email', async () => {
      await expect(
        signInWithEmailLink('unknown@example.com'),
      ).rejects.toThrow('Email not recognized');
    });

    it('should accept test-employee email via Supabase signUp', async () => {
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'new-uid', identities: [{ id: '1' }] } },
        error: null,
      });

      // Should not throw
      await expect(
        signInWithEmailLink('test-employee@example.com')
      ).resolves.not.toThrow();

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'test-employee@example.com',
        password: 'mockPassword123!',
      });
    });

    it('should accept test-manager email', async () => {
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'manager-uid', identities: [{ id: '1' }] } },
        error: null,
      });

      await expect(
        signInWithEmailLink('test-manager@example.com')
      ).resolves.not.toThrow();
    });

    it('should accept test-admin email', async () => {
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'admin-uid', identities: [{ id: '1' }] } },
        error: null,
      });

      await expect(
        signInWithEmailLink('test-admin@example.com')
      ).resolves.not.toThrow();
    });

    it('should try signInWithPassword when user already exists', async () => {
      // signUp returns user with empty identities = user already exists
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'existing-uid', identities: [] } },
        error: null,
      });

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'existing-uid' } },
        error: null,
      });

      await expect(
        signInWithEmailLink('test-employee@example.com')
      ).resolves.not.toThrow();

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test-employee@example.com',
        password: 'mockPassword123!',
      });
    });

    it('should fall back to localStorage when Supabase auth unavailable', async () => {
      mockSupabaseAuth.signUp.mockRejectedValueOnce(
        new Error('Supabase connection failed')
      );

      await signInWithEmailLink('test-employee@example.com');

      // Should have stored in localStorage
      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.email).toBe('test-employee@example.com');
        expect(parsed.role).toBe('employee');
      }
    });

    it('should fall back to localStorage when signInWithPassword fails', async () => {
      // signUp says user exists
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'existing-uid', identities: [] } },
        error: null,
      });

      // signInWithPassword fails
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      await signInWithEmailLink('test-employee@example.com');

      // Should have fallen back to localStorage
      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
    });

    it('should use getAuthCredential for Users panel-created users', async () => {
      // Re-import and mock getAuthCredential
      const { getAuthCredential } = await import('./supabase');
      vi.mocked(getAuthCredential).mockReturnValueOnce({
        email: 'panel-user@example.com',
        role: 'manager',
        uid: 'panel-uid',
      });

      await signInWithEmailLink('panel-user@example.com');

      // Should have stored in localStorage without calling Supabase auth
      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.uid).toBe('panel-uid');
        expect(parsed.role).toBe('manager');
      }

      expect(mockSupabaseAuth.signUp).not.toHaveBeenCalled();
    });
  });

  describe('signInWithEmailLink - Defense-in-Depth (credential role override)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      // Reset instance mock to prevent unconsumed mockOnce values from leaking
      // into subsequent tests (defense-in-depth code may not consume them until
      // the implementation is added)
      mockGetInstanceByEmployeeEmail.mockReset();
      mockGetInstanceByEmployeeEmail.mockResolvedValue(null);
    });

    it('should override stale manager credential to employee when instance exists', async () => {
      // Auth credential says 'manager' but user has an onboarding instance (= employee)
      const { getAuthCredential } = await import('./supabase');
      vi.mocked(getAuthCredential).mockReturnValueOnce({
        email: 'stale-user@example.com',
        role: 'manager',
        uid: 'stale-uid',
      });

      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce({
        instanceId: 'inst-1',
        employeeName: 'Stale User',
      });

      await signInWithEmailLink('stale-user@example.com');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.uid).toBe('stale-uid');
      expect(parsed.email).toBe('stale-user@example.com');
      expect(parsed.role).toBe('employee'); // Overridden from 'manager' to 'employee'
    });

    it('should keep credential role when no instance exists', async () => {
      const { getAuthCredential } = await import('./supabase');
      vi.mocked(getAuthCredential).mockReturnValueOnce({
        email: 'real-manager@example.com',
        role: 'manager',
        uid: 'manager-uid',
      });

      // No instance found
      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce(null);

      await signInWithEmailLink('real-manager@example.com');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.role).toBe('manager'); // Kept as-is
    });

    it('should keep credential role when instance check throws (graceful fallback)', async () => {
      const { getAuthCredential } = await import('./supabase');
      vi.mocked(getAuthCredential).mockReturnValueOnce({
        email: 'admin-user@example.com',
        role: 'admin',
        uid: 'admin-uid',
      });

      // Instance check throws (Supabase unreachable)
      mockGetInstanceByEmployeeEmail.mockRejectedValueOnce(
        new Error('Supabase connection refused')
      );

      await signInWithEmailLink('admin-user@example.com');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.role).toBe('admin'); // Kept as-is, graceful fallback
    });
  });

  describe('signInWithEmailLink - Mock Auth Write on Supabase Auth Success', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should write mockAuthUser to localStorage when signUp succeeds', async () => {
      // signUp returns a new user with identities
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'supabase-new-uid', identities: [{ id: '1' }] } },
        error: null,
      });

      await signInWithEmailLink('test-employee@example.com');

      // Should have written mockAuthUser to localStorage
      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.uid).toBe('supabase-new-uid');
        expect(parsed.email).toBe('test-employee@example.com');
        expect(parsed.role).toBe('employee');
      }
    });

    it('should write mockAuthUser to localStorage when signInWithPassword succeeds', async () => {
      // signUp returns user with empty identities (existing user)
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'existing-uid', identities: [] } },
        error: null,
      });

      // signInWithPassword succeeds
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'existing-uid' } },
        error: null,
      });

      await signInWithEmailLink('test-employee@example.com');

      // Should have written mockAuthUser to localStorage
      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.uid).toBe('existing-uid');
        expect(parsed.email).toBe('test-employee@example.com');
        expect(parsed.role).toBe('employee');
      }
    });
  });

  describe('signInWithEmailLink - Hire Email', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should sign in hire email as employee when instance exists', async () => {
      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce({
        instanceId: 'inst-hire-1',
        employeeName: 'Delaney Smith',
      });

      await signInWithEmailLink('delaney@gmail.com');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.email).toBe('delaney@gmail.com');
      expect(parsed.role).toBe('employee');
      expect(parsed.uid).toBeTruthy();
    });

    it('should dispatch authStorageChange event for hire email', async () => {
      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce({
        instanceId: 'inst-hire-1',
        employeeName: 'Delaney Smith',
      });

      const eventSpy = vi.fn();
      window.addEventListener('authStorageChange', eventSpy);

      await signInWithEmailLink('delaney@gmail.com');

      expect(eventSpy).toHaveBeenCalled();
      window.removeEventListener('authStorageChange', eventSpy);
    });

    it('should NOT call Supabase Auth for hire email', async () => {
      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce({
        instanceId: 'inst-hire-1',
        employeeName: 'Delaney Smith',
      });

      await signInWithEmailLink('delaney@gmail.com');

      expect(mockSupabaseAuth.signUp).not.toHaveBeenCalled();
      expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should still reject unknown email with no instance and no MOCK_EMAIL_ROLES entry', async () => {
      // getInstanceByEmployeeEmail returns null (no instance found)
      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce(null);

      await expect(
        signInWithEmailLink('totally-unknown@example.com')
      ).rejects.toThrow('Email not recognized');
    });

    it('should fall through to MOCK_EMAIL_ROLES when instance lookup throws', async () => {
      mockGetInstanceByEmployeeEmail.mockRejectedValueOnce(
        new Error('Supabase connection refused')
      );

      // test-employee@example.com is in MOCK_EMAIL_ROLES, so it should succeed
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'test-uid', identities: [{ id: '1' }] } },
        error: null,
      });

      await expect(
        signInWithEmailLink('test-employee@example.com')
      ).resolves.not.toThrow();
    });

    it('should handle hire email case-insensitively', async () => {
      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce({
        instanceId: 'inst-hire-2',
        employeeName: 'Delaney',
      });

      await signInWithEmailLink('Delaney@Gmail.COM');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.email).toBe('delaney@gmail.com');
      expect(parsed.role).toBe('employee');
    });
  });

  describe('signInWithEmailLink - Users table lookup (Step 1.5)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      mockGetUserByEmail.mockReset();
      mockGetUserByEmail.mockResolvedValue(null);
      mockGetInstanceByEmployeeEmail.mockReset();
      mockGetInstanceByEmployeeEmail.mockResolvedValue(null);
      mockAddUserToAuthCredentials.mockReset();
    });

    it('signs in Users-panel user when no localStorage credential exists and getUserByEmail returns user with roles', async () => {
      mockGetUserByEmail.mockResolvedValueOnce({
        id: 'users-panel-id-1',
        email: 'paneluser@company.com',
        roles: ['software engineer'],
      });

      await signInWithEmailLink('paneluser@company.com');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.uid).toBe('users-panel-id-1');
      expect(parsed.email).toBe('paneluser@company.com');
      // Should NOT call Supabase Auth signUp
      expect(mockSupabaseAuth.signUp).not.toHaveBeenCalled();
    });

    it('sets mockAuthUser role to manager (not custom role name)', async () => {
      mockGetUserByEmail.mockResolvedValueOnce({
        id: 'users-panel-id-2',
        email: 'customrole@company.com',
        roles: ['lead designer'],
      });

      await signInWithEmailLink('customrole@company.com');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.role).toBe('manager');
    });

    it('calls addUserToAuthCredentials to cache credential in localStorage', async () => {
      mockGetUserByEmail.mockResolvedValueOnce({
        id: 'users-panel-id-3',
        email: 'cached@company.com',
        roles: ['analyst'],
      });

      await signInWithEmailLink('cached@company.com');

      expect(mockAddUserToAuthCredentials).toHaveBeenCalledWith(
        'cached@company.com',
        'manager',
        'users-panel-id-3'
      );
    });

    it('dispatches authStorageChange event after successful lookup', async () => {
      mockGetUserByEmail.mockResolvedValueOnce({
        id: 'users-panel-id-4',
        email: 'eventtest@company.com',
        roles: ['manager'],
      });

      const eventSpy = vi.fn();
      window.addEventListener('authStorageChange', eventSpy);

      await signInWithEmailLink('eventtest@company.com');

      expect(eventSpy).toHaveBeenCalled();
      window.removeEventListener('authStorageChange', eventSpy);
    });

    it('skips roleless users (getUserByEmail returns user with empty roles array) and falls through to Step 2', async () => {
      // getUserByEmail returns user with NO roles (Google OAuth user without assigned role)
      mockGetUserByEmail.mockResolvedValueOnce({
        id: 'oauth-user-1',
        email: 'test-employee@example.com',
        roles: [],
      });

      // Step 2: instance check returns null, falls through to Step 3
      mockGetInstanceByEmployeeEmail.mockResolvedValue(null);

      // Step 3: test-employee@example.com is in MOCK_EMAIL_ROLES
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'mock-uid', identities: [{ id: '1' }] } },
        error: null,
      });

      await signInWithEmailLink('test-employee@example.com');

      // Should NOT have cached credentials for the roleless user
      expect(mockAddUserToAuthCredentials).not.toHaveBeenCalled();
      // Should have fallen through to MOCK_EMAIL_ROLES (Supabase signUp)
      expect(mockSupabaseAuth.signUp).toHaveBeenCalled();
    });

    it('falls through gracefully when getUserByEmail throws (Supabase unreachable)', async () => {
      mockGetUserByEmail.mockRejectedValueOnce(
        new Error('Supabase connection refused')
      );

      // Step 2: instance check returns null, falls through to Step 3
      mockGetInstanceByEmployeeEmail.mockResolvedValue(null);

      // Step 3: test-manager@example.com is in MOCK_EMAIL_ROLES
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'mock-uid', identities: [{ id: '1' }] } },
        error: null,
      });

      await expect(
        signInWithEmailLink('test-manager@example.com')
      ).resolves.not.toThrow();

      // Should have fallen through to MOCK_EMAIL_ROLES
      expect(mockSupabaseAuth.signUp).toHaveBeenCalled();
    });

    it('overrides role to employee when user also has an onboarding instance (defense-in-depth)', async () => {
      mockGetUserByEmail.mockResolvedValueOnce({
        id: 'dual-user-1',
        email: 'dualrole@company.com',
        roles: ['team lead'],
      });

      // Defense-in-depth: this user also has an onboarding instance
      mockGetInstanceByEmployeeEmail.mockResolvedValueOnce({
        instanceId: 'inst-dual-1',
        employeeName: 'Dual Role User',
      });

      await signInWithEmailLink('dualrole@company.com');

      const stored = localStorage.getItem('mockAuthUser');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.role).toBe('employee'); // Overridden from 'manager' to 'employee'
      expect(parsed.uid).toBe('dual-user-1');
    });
  });

  describe('signOut', () => {
    it('should clear localStorage mock auth', async () => {
      const mockRemoveItem = vi.fn();
      vi.stubGlobal('localStorage', {
        removeItem: mockRemoveItem,
      } as any);

      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null });

      await signOut();

      expect(mockRemoveItem).toHaveBeenCalledWith('mockAuthUser');
    });

    it('should gracefully handle Supabase signOut failure', async () => {
      const mockRemoveItem = vi.fn();
      vi.stubGlobal('localStorage', {
        removeItem: mockRemoveItem,
      } as any);

      mockSupabaseAuth.signOut.mockRejectedValueOnce(
        new Error('Sign-out failed')
      );

      // Should not throw - just log warning
      await expect(signOut()).resolves.not.toThrow();
    });

    it('should call Supabase signOut', async () => {
      const mockRemoveItem = vi.fn();
      vi.stubGlobal('localStorage', {
        removeItem: mockRemoveItem,
      } as any);

      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null });

      await signOut();

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    it('should call supabase.auth.signInWithOAuth with Google provider', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({ error: null });

      await signInWithGoogle();

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    });

    it('should throw on OAuth error', async () => {
      const oauthError = { message: 'OAuth provider not configured' };
      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({ error: oauthError });

      await expect(signInWithGoogle()).rejects.toEqual(oauthError);
    });

    it('should not throw when OAuth succeeds', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({ error: null });

      await expect(signInWithGoogle()).resolves.not.toThrow();
    });
  });

  describe('ensureUserExists', () => {
    it('should upsert user row with correct fields', async () => {
      await ensureUserExists('uid-google-1', 'jane@company.com', 'Jane Doe');

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockUpsert).toHaveBeenCalledWith({
        id: 'uid-google-1',
        email: 'jane@company.com',
        name: 'Jane Doe',
        updated_at: expect.any(String),
      });
    });

    it('should use email prefix as name when displayName not provided', async () => {
      await ensureUserExists('uid-google-2', 'bob@company.com');

      expect(mockUpsert).toHaveBeenCalledWith({
        id: 'uid-google-2',
        email: 'bob@company.com',
        name: 'bob',
        updated_at: expect.any(String),
      });
    });

    it('should throw on upsert error', async () => {
      mockUpsert.mockResolvedValueOnce({
        error: { message: 'Upsert failed' },
      });

      await expect(
        ensureUserExists('uid-google-3', 'fail@company.com'),
      ).rejects.toBeTruthy();
    });
  });
});
