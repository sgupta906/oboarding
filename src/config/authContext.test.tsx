/**
 * AuthContext Tests
 * Tests for AuthProvider component and useAuth hook
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './authContext';
import * as authService from '../services/authService';

// Mock Supabase client - use vi.hoisted() so mock is available when vi.mock factory runs
const { mockOnAuthStateChange } = vi.hoisted(() => ({
  mockOnAuthStateChange: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

// Mock auth service
vi.mock('../services/authService', () => ({
  getUserRole: vi.fn(),
  signOut: vi.fn(),
}));

describe('AuthContext and useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default: onAuthStateChange returns subscription with unsubscribe
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useAuth Hook - Error Handling', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress error logs for this expected error
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('AuthProvider - Loading State', () => {
    it('should show loading state initially', () => {
      // onAuthStateChange doesn't call back yet
      mockOnAuthStateChange.mockImplementation(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('AuthProvider - Unauthenticated State', () => {
    it('should set unauthenticated state when no user is logged in', async () => {
      mockOnAuthStateChange.mockImplementation((callback: any) => {
        // Call back with no session (user signed out)
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('AuthProvider - Authenticated State with Role', () => {
    it('should set authenticated state with user and role when user logs in', async () => {
      vi.mocked(authService.getUserRole).mockResolvedValue('employee');

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_IN', {
          user: { id: 'test-uid-123', email: 'test@example.com' },
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual({
        uid: 'test-uid-123',
        email: 'test@example.com',
        role: 'employee',
      });
      expect(result.current.role).toBe('employee');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set manager role when user has manager privileges', async () => {
      vi.mocked(authService.getUserRole).mockResolvedValue('manager');

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_IN', {
          user: { id: 'manager-uid', email: 'manager@example.com' },
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.role).toBe('manager');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set admin role when user has admin privileges', async () => {
      vi.mocked(authService.getUserRole).mockResolvedValue('admin');

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_IN', {
          user: { id: 'admin-uid', email: 'admin@example.com' },
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.role).toBe('admin');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('AuthProvider - Role Fetch Error Handling', () => {
    it('should clear user state when role fetch fails', async () => {
      vi.mocked(authService.getUserRole).mockResolvedValue(null);

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_IN', {
          user: { id: 'test-uid-123', email: 'test@example.com' },
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle getUserRole exceptions gracefully', async () => {
      vi.mocked(authService.getUserRole).mockRejectedValue(
        new Error('Database error'),
      );

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_IN', {
          user: { id: 'test-uid-123', email: 'test@example.com' },
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('AuthProvider - User Without Email', () => {
    it('should handle Supabase user without email gracefully', async () => {
      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_IN', {
          user: { id: 'test-uid-123', email: null },
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('AuthProvider - Cleanup on Unmount', () => {
    it('should unsubscribe from auth state changes on unmount', async () => {
      const mockUnsubscribe = vi.fn();

      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('AuthProvider - Context Value Methods', () => {
    it('should provide signOut function from context', async () => {
      vi.mocked(authService.getUserRole).mockResolvedValue('employee');
      vi.mocked(authService.signOut).mockResolvedValue(undefined);

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_IN', {
          user: { id: 'test-uid-123', email: 'test@example.com' },
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.signOut).toBe('function');
    });
  });

  describe('AuthProvider - Mock Auth from localStorage', () => {
    it('should load mock auth from localStorage on mount', async () => {
      const mockAuthData = {
        uid: 'mock-uid-123',
        email: 'test-employee@example.com',
        role: 'employee' as const,
      };

      localStorage.setItem('mockAuthUser', JSON.stringify(mockAuthData));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockAuthData);
      expect(result.current.role).toBe('employee');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle invalid JSON in localStorage gracefully', async () => {
      localStorage.setItem('mockAuthUser', 'invalid-json-{');

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('mockAuthUser')).toBeNull();
    });

    it('should handle mock auth with missing fields', async () => {
      const incompleteMockAuth = {
        uid: 'mock-uid',
        email: 'test@example.com',
        // missing role field
      };

      localStorage.setItem('mockAuthUser', JSON.stringify(incompleteMockAuth));

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('mockAuthUser')).toBeNull();
    });
  });

  describe('AuthProvider - Storage Event Listener', () => {
    it('should update auth state when custom authStorageChange event is dispatched', async () => {
      // Start with no auth
      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Simulate signInWithEmailLink writing to localStorage
      const mockAuthData = {
        uid: 'new-user-uid',
        email: 'test-employee@example.com',
        role: 'employee' as const,
      };

      localStorage.setItem('mockAuthUser', JSON.stringify(mockAuthData));

      // Dispatch custom event (as SignInView does after sign-in)
      const event = new CustomEvent('authStorageChange', {
        detail: { key: 'mockAuthUser' },
      });
      window.dispatchEvent(event);

      // Wait for auth state to update
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.user).toEqual(mockAuthData);
      expect(result.current.role).toBe('employee');
    });

    it('should handle storage events from other tabs', async () => {
      // Start with no auth
      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mockAuthData = {
        uid: 'other-tab-uid',
        email: 'test-manager@example.com',
        role: 'manager' as const,
      };

      localStorage.setItem('mockAuthUser', JSON.stringify(mockAuthData));

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'mockAuthUser',
        newValue: JSON.stringify(mockAuthData),
      });
      window.dispatchEvent(storageEvent);

      // Wait for auth state to update
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.role).toBe('manager');
    });

    it('should not update auth if storage event is for different key', async () => {
      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      localStorage.setItem('someOtherKey', 'someValue');

      const event = new CustomEvent('authStorageChange', {
        detail: { key: 'someOtherKey' },
      });
      window.dispatchEvent(event);

      // Auth state should remain unchanged
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should clean up event listeners on unmount', async () => {
      mockOnAuthStateChange.mockImplementation((callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      unmount();

      // Should remove both 'storage' and 'authStorageChange' listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'storage',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'authStorageChange',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
