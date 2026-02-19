/**
 * Authentication Context and Provider
 * Manages user authentication state and makes it available throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getUserRole, signOut, ensureUserExists } from '../services/authService';
import { getInstanceByEmployeeEmail } from '../services/supabase';
import { getDevAuthUUID } from '../utils/uuid';
import type { AuthUser, UserRole, AuthContextValue } from './authTypes';

/**
 * Auth context - provides authentication state to the app
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Test user impersonation (development/QA only)
 * When using dev auth mode, allows switching between test user accounts
 * without re-authentication for faster QA workflows.
 *
 * Security: This mechanism is only available when VITE_USE_DEV_AUTH=true
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
 * SECURITY WARNING: This is development-only and relies on VITE_USE_DEV_AUTH
 * Check should prevent this from being available in production.
 */
export function impersonateUserForQA(options: ImpersonateUserOptions): void {
  // Verify we're in dev auth mode before allowing impersonation
  if (import.meta.env.VITE_USE_DEV_AUTH !== 'true') {
    console.error('Test user impersonation is only available in dev auth mode');
    return;
  }

  // Store impersonated user in localStorage
  localStorage.setItem(
    'mockAuthUser',
    JSON.stringify({
      uid: getDevAuthUUID(options.email),
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
 * Used for development fallback when Supabase instance is not connected
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
 * 1. Listen to Supabase auth state changes via onAuthStateChange
 * 2. Listen to localStorage storage events (for mock auth fallback)
 * 3. Fetch user's role from Supabase on auth state change
 * 4. Handle loading state while fetching auth and role data
 * 5. Provide auth context to all child components
 *
 * Error handling:
 * - If role fetch fails, role is set to null (not an auth error)
 * - Auth errors are logged but don't block the app
 * - Storage events are handled reactively to support localStorage updates
 *
 * localStorage fallback:
 * - When Supabase instance is not connected, uses localStorage for dev auth
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
    // Check localStorage for mock auth first (fallback for development without live Supabase)
    const mockUser = loadMockAuthFromStorage();
    if (mockUser) {
      setUser(mockUser);
      setRole(mockUser.role);
      setLoading(false);
      // DO NOT return early -- fall through to set up onAuthStateChange below.
      // Even when mock auth is active, we need supabase-js to maintain its
      // internal session so Realtime WebSocket has a valid JWT for auth.
    }

    // Always listen to Supabase auth state changes.
    // When mock auth is active, the listener lets supabase-js manage its
    // internal session for Realtime. The callback guards against overwriting
    // mock auth state (mock auth takes precedence for UI role routing).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // If mock auth is active, don't overwrite app-level user/role state.
        // The onAuthStateChange listener is only here so supabase-js can
        // maintain its internal session for Realtime WebSocket auth.
        const currentMockUser = loadMockAuthFromStorage();
        if (currentMockUser) {
          return; // Mock auth takes precedence for UI state
        }

        try {
          if (session?.user?.email) {
            // User is authenticated, fetch their role from Supabase
            const userRole = await getUserRole(session.user.id);

            if (userRole) {
              // Defense-in-depth: if the user has an onboarding instance,
              // they are an employee regardless of what user_roles says.
              // This prevents custom role names (e.g., "Software Engineer")
              // from granting manager access to Google OAuth hires.
              let effectiveRole = userRole;
              try {
                const instance = await getInstanceByEmployeeEmail(session.user.email);
                if (instance) {
                  effectiveRole = 'employee';
                }
              } catch {
                // Instance check failed — fall through with original role
              }

              const authUser: AuthUser = {
                uid: session.user.id,
                email: session.user.email,
                role: effectiveRole,
              };

              setUser(authUser);
              setRole(effectiveRole);
            } else {
              // Google OAuth user with no role yet -- create user row
              // and set authenticated state with role=null
              await ensureUserExists(
                session.user.id,
                session.user.email,
                session.user.user_metadata?.full_name,
              );
              setUser({
                uid: session.user.id,
                email: session.user.email,
                role: null,
              });
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
      },
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    /**
     * Handle localStorage changes for mock auth fallback
     * This listener is triggered when signInWithEmailLink writes to localStorage
     * in development environments where Supabase instance is not connected.
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
 *     {hasManagerAccess(role) && <ManagerView />}
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
