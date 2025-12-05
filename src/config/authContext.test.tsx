/**
 * AuthContext Tests
 * Tests for AuthProvider component and useAuth hook
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './authContext';
import { onAuthStateChanged } from 'firebase/auth';
import * as authService from '../services/authService';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

// Mock auth service
vi.mock('../services/authService', () => ({
  getUserRole: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Firebase config
vi.mock('./firebase', () => ({
  auth: {},
  firestore: {},
  storage: {},
}));

describe('AuthContext and useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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
      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, _callback) => () => {},
      );

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
      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return () => {};
        },
      );

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
      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
      };

      vi.mocked(authService.getUserRole).mockResolvedValue('employee');

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockFirebaseUser);
          return () => {};
        },
      );

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
      const mockFirebaseUser = {
        uid: 'manager-uid',
        email: 'manager@example.com',
      };

      vi.mocked(authService.getUserRole).mockResolvedValue('manager');

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockFirebaseUser);
          return () => {};
        },
      );

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
      const mockFirebaseUser = {
        uid: 'admin-uid',
        email: 'admin@example.com',
      };

      vi.mocked(authService.getUserRole).mockResolvedValue('admin');

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockFirebaseUser);
          return () => {};
        },
      );

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
      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
      };

      vi.mocked(authService.getUserRole).mockResolvedValue(null);

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockFirebaseUser);
          return () => {};
        },
      );

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
      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
      };

      vi.mocked(authService.getUserRole).mockRejectedValue(
        new Error('Firestore error'),
      );

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockFirebaseUser);
          return () => {};
        },
      );

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
    it('should handle Firebase user without email gracefully', async () => {
      const mockFirebaseUserNoEmail = {
        uid: 'test-uid-123',
        email: null,
      };

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockFirebaseUserNoEmail);
          return () => {};
        },
      );

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

      vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe);

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
      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
      };

      vi.mocked(authService.getUserRole).mockResolvedValue('employee');
      vi.mocked(authService.signOut).mockResolvedValue(undefined);

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockFirebaseUser);
          return () => {};
        },
      );

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

      // Set Firebase listener to never complete (shouldn't be called)
      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, _callback) => () => {},
      );

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

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return () => {};
        },
      );

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

      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return () => {};
        },
      );

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
      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return () => {};
        },
      );

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
      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return () => {};
        },
      );

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
      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return () => {};
        },
      );

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
      vi.mocked(onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return () => {};
        },
      );

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
