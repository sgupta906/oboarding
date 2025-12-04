/**
 * Authentication Context and Provider
 * Manages user authentication state and makes it available throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getUserRole, signOut } from '../services/authService';
import type { AuthUser, UserRole, AuthContextValue } from './authTypes';

/**
 * Auth context - provides authentication state to the app
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Test user impersonation (development/QA only)
 * When using Firebase emulator, allows switching between test user accounts
 * without re-authentication for faster QA workflows.
 *
 * Security: This mechanism is only available when VITE_USE_FIREBASE_EMULATOR=true
 * and must never be exposed in production builds.
 */
export interface ImpersonateUserOptions {
  email: string;
  role: UserRole;
}

/**
 * Impersonate a test user for QA testing (emulator mode only)
 * This allows testers to quickly switch between different user roles
 * without going through the sign-in flow.
 *
 * SECURITY WARNING: This is development-only and relies on VITE_USE_FIREBASE_EMULATOR
 * Check should prevent this from being available in production.
 */
export function impersonateUserForQA(options: ImpersonateUserOptions): void {
  // Verify we're in emulator mode before allowing impersonation
  if (import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') {
    console.error('Test user impersonation is only available in emulator mode');
    return;
  }

  // Store impersonated user in localStorage
  localStorage.setItem(
    'mockAuthUser',
    JSON.stringify({
      uid: `test-${options.email.split('@')[0]}`,
      email: options.email,
      role: options.role,
    })
  );

  // Dispatch custom event to notify AuthProvider of the change
  window.dispatchEvent(
    new CustomEvent('authStorageChange', {
      detail: { key: 'mockAuthUser' },
    })
  );

  // eslint-disable-next-line no-console
  console.log(`[QA] Impersonating ${options.role} (${options.email})`);
}

/**
 * Helper function to load and validate mock auth from localStorage
 * Used for development fallback when Firebase emulator is not running
 *
 * @returns Parsed AuthUser if valid mock auth exists, null otherwise
 */
function loadMockAuthFromStorage(): AuthUser | null {
  try {
    const mockAuthStr = localStorage.getItem('mockAuthUser');
    if (!mockAuthStr) {
      return null;
    }

    const mockUser = JSON.parse(mockAuthStr) as {
      uid: string;
      email: string;
      role: UserRole;
    };

    // Validate parsed data has required fields
    if (!mockUser.uid || !mockUser.email || !mockUser.role) {
      console.warn('Invalid mock auth data in localStorage');
      localStorage.removeItem('mockAuthUser');
      return null;
    }

    return {
      uid: mockUser.uid,
      email: mockUser.email,
      role: mockUser.role,
    };
  } catch (error) {
    console.warn('Failed to parse mock auth from localStorage:', error);
    localStorage.removeItem('mockAuthUser');
    return null;
  }
}

/**
 * AuthProvider component wrapper
 * Should wrap the entire app to provide auth state everywhere
 *
 * Responsibilities:
 * 1. Listen to Firebase auth state changes via onAuthStateChanged
 * 2. Listen to localStorage storage events (for mock auth fallback)
 * 3. Fetch user's role from Firestore on auth state change
 * 4. Handle loading state while fetching auth and role data
 * 5. Provide auth context to all child components
 *
 * Error handling:
 * - If role fetch fails, role is set to null (not an auth error)
 * - Auth errors are logged but don't block the app
 * - Storage events are handled reactively to support localStorage updates
 *
 * localStorage fallback:
 * - When Firebase emulator is not running, uses localStorage for dev auth
 * - Listens for 'storage' events to detect localStorage updates from signInWithEmailLink
 * - Automatically updates auth state when localStorage is modified
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for mock auth first (fallback for development without emulator)
    const mockUser = loadMockAuthFromStorage();
    if (mockUser) {
      setUser(mockUser);
      setRole(mockUser.role);
      setLoading(false);
      return; // Don't listen to Firebase if using mock auth
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser && firebaseUser.email) {
          // User is authenticated, fetch their role from Firestore
          const userRole = await getUserRole(firebaseUser.uid);

          if (userRole) {
            // Successfully fetched role
            const authUser: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userRole,
            };

            setUser(authUser);
            setRole(userRole);
          } else {
            // Failed to get role, clear user state
            console.warn(
              'User authenticated but role not found in Firestore',
            );
            setUser(null);
            setRole(null);
          }
        } else {
          // User is not authenticated
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    /**
     * Handle localStorage changes for mock auth fallback
     * This listener is triggered when signInWithEmailLink writes to localStorage
     * in development environments where Firebase emulator is not running.
     *
     * The storage event fires on OTHER tabs/windows when localStorage changes,
     * but NOT on the current tab. We use a custom approach to detect changes:
     * - Check if mockAuthUser was added/updated
     * - Update auth state immediately
     *
     * Note: In practice, since this app is single-window, we use a custom event
     * approach (see storage event handler comment below for details).
     */
    const handleStorageChange = () => {
      const mockUser = loadMockAuthFromStorage();
      if (mockUser) {
        // localStorage has a new/updated mockAuthUser
        setUser(mockUser);
        setRole(mockUser.role);
        setLoading(false);
      }
    };

    /**
     * Listen for storage events from OTHER tabs/windows
     * When user signs in on another tab, this tab's storage event fires
     */
    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for same-tab localStorage updates
    // (browser doesn't fire storage event on the tab that made the change)
    const handleCustomStorageEvent = ((event: Event) => {
      if (event instanceof CustomEvent && event.detail?.key === 'mockAuthUser') {
        const mockUser = loadMockAuthFromStorage();
        if (mockUser) {
          // User was added/updated in localStorage
          setUser(mockUser);
          setRole(mockUser.role);
          setLoading(false);
        } else {
          // User was removed from localStorage (sign out)
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      }
    }) as EventListener;

    window.addEventListener('authStorageChange', handleCustomStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStorageChange', handleCustomStorageEvent);
    };
  }, []);

  const value: AuthContextValue = {
    user,
    role,
    loading,
    isAuthenticated: user !== null,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Provides access to authentication state throughout the app
 *
 * Usage:
 * ```tsx
 * const { user, role, loading, isAuthenticated } = useAuth();
 *
 * if (loading) return <LoadingSpinner />;
 * if (!isAuthenticated) return <SignInView />;
 *
 * return (
 *   <>
 *     {role === 'employee' && <EmployeeView />}
 *     {(role === 'manager' || role === 'admin') && <ManagerView />}
 *   </>
 * );
 * ```
 *
 * @returns AuthContextValue containing user, role, loading state, and signOut function
 * @throws Error if hook is used outside of AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
