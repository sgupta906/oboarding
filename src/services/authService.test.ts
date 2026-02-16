/**
 * Auth Service Tests
 * Tests for Supabase authentication service functions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  signInWithEmailLink,
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

// Mock getAuthCredential from ./supabase barrel
vi.mock('./supabase', () => ({
  getAuthCredential: vi.fn().mockReturnValue(null),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default return values
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
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
      const testRoles: Array<'employee' | 'manager' | 'admin'> = [
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
});
