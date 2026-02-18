/**
 * Authentication Service
 * Handles user authentication, role management, and Supabase user operations
 */

import { supabase } from '../config/supabase';
import type { UserRole } from '../config/authTypes';
import { getAuthCredential, getInstanceByEmployeeEmail } from './supabase';
import { getDevAuthUUID } from '../utils/uuid';
import { EMAIL_REGEX } from '../utils/validation';

/**
 * Maps test emails to their predefined roles for mock sign-in
 * In production, roles would come from a proper auth provider or admin console
 */
const MOCK_EMAIL_ROLES: Record<string, UserRole> = {
  'test-employee@example.com': 'employee',
  'test-manager@example.com': 'manager',
  'test-admin@example.com': 'admin',
};

/**
 * Creates or updates a user record and their role in Supabase.
 * Upserts the user row and replaces the role in the user_roles junction table.
 *
 * @param uid - User's unique identifier
 * @param email - User's email address
 * @param role - User's role (employee, manager, or admin)
 * @returns Promise that resolves when user and role are saved
 * @throws Error if Supabase operations fail
 */
export async function setUserRole(
  uid: string,
  email: string,
  role: UserRole,
): Promise<void> {
  try {
    // Upsert user row
    const { error: userError } = await supabase.from('users').upsert({
      id: uid,
      email,
      name: email.split('@')[0],
      updated_at: new Date().toISOString(),
    });

    if (userError) {
      throw userError;
    }

    // Delete existing roles
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', uid);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: uid, role_name: role });

    if (insertError) {
      throw insertError;
    }
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}

/**
 * Retrieves a user's role from Supabase via the users + user_roles tables.
 *
 * @param uid - User's unique identifier
 * @returns Promise resolving to user's role or null if not found
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_roles(role_name)')
      .eq('id', uid)
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.warn(`Error fetching role for uid ${uid}:`, error.message);
      } else {
        console.warn(`User document not found for uid: ${uid}`);
      }
      return null;
    }

    // Extract role from the junction table join
    const roles = (data as any).user_roles as Array<{ role_name: string }> | undefined;
    const roleName = roles?.[0]?.role_name ?? null;

    return roleName as UserRole | null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Signs in the user using Google OAuth via Supabase's built-in provider.
 * This triggers a redirect to Google's consent screen. On successful
 * authorization, the user is redirected back to the app and
 * onAuthStateChange fires automatically to handle the session.
 *
 * @returns Promise that resolves when the redirect is initiated
 * @throws Error if the OAuth request fails
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/**
 * Ensures a user row exists in the `users` table for the given auth user.
 * Uses upsert so it is idempotent -- safe to call on every sign-in.
 * Does NOT create a user_roles entry (role is assigned by a manager).
 *
 * @param uid - Supabase Auth UUID
 * @param email - User's email address
 * @param displayName - Optional display name from OAuth provider
 * @throws Error if the upsert fails
 */
export async function ensureUserExists(
  uid: string,
  email: string,
  displayName?: string,
): Promise<void> {
  const name = displayName || email.split('@')[0];
  const { error } = await supabase.from('users').upsert({
    id: uid,
    email,
    name,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('Failed to ensure user exists:', error);
    throw error;
  }
}

/**
 * Mock sign-in with email link (stubbed for demo)
 * In production, this would use Supabase magic link or OAuth.
 * For testing, we use predefined test emails with hardcoded roles.
 *
 * This implementation uses a hybrid approach:
 * 1. Validates email against test email list
 * 2. Attempts Supabase Auth sign-up/sign-in
 * 3. Falls back to localStorage mock for development without live Supabase
 * 4. Stores user role in Supabase or localStorage
 *
 * @param email - User's email address
 * @returns Promise that resolves when sign-in is processed
 * @throws Error if sign-in fails
 */
export async function signInWithEmailLink(email: string): Promise<void> {
  try {
    // Validate email format
    if (!EMAIL_REGEX.test(email.trim())) {
      throw new Error('Please enter a valid email address');
    }

    const trimmedEmail = email.trim().toLowerCase();

    // First, check if this user was created via the Users panel
    const dynamicCredential = getAuthCredential(trimmedEmail);
    if (dynamicCredential) {
      // User was created via Users panel - use their stored credentials
      localStorage.setItem(
        'mockAuthUser',
        JSON.stringify({
          uid: dynamicCredential.uid,
          email: dynamicCredential.email,
          role: dynamicCredential.role,
        })
      );

      // Notify AuthProvider so it can pick up the auth change immediately
      window.dispatchEvent(
        new CustomEvent('authStorageChange', {
          detail: { key: 'mockAuthUser' },
        })
      );

      console.log(`[Auth] Signed in as ${trimmedEmail} (${dynamicCredential.role}) - created via Users panel`);
      return;
    }

    // Check if this email belongs to an onboarding instance (hire)
    try {
      const instance = await getInstanceByEmployeeEmail(trimmedEmail);
      if (instance) {
        const hireUid = getDevAuthUUID(trimmedEmail);
        localStorage.setItem(
          'mockAuthUser',
          JSON.stringify({
            uid: hireUid,
            email: trimmedEmail,
            role: 'employee',
          })
        );
        window.dispatchEvent(
          new CustomEvent('authStorageChange', {
            detail: { key: 'mockAuthUser' },
          })
        );
        console.log(`[Auth] Signed in as ${trimmedEmail} (employee) - hire with onboarding instance`);
        return;
      }
    } catch (instanceError) {
      // Supabase may be unavailable -- fall through to MOCK_EMAIL_ROLES
      console.warn('Instance lookup failed, falling through:', instanceError);
    }

    // Determine role from mock email mapping (fallback for test accounts)
    const mockRole = MOCK_EMAIL_ROLES[trimmedEmail];

    if (!mockRole) {
      throw new Error(
        'Email not recognized. Use test-employee@example.com, test-manager@example.com, test-admin@example.com, or create a user in the Users panel.',
      );
    }

    // Generate a deterministic UUID from email for consistency
    const fallbackUUID = getDevAuthUUID(trimmedEmail);
    let uid: string;
    let useSupabaseAuth = true;

    try {
      // Try to sign up a new user with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: 'mockPassword123!',
      });

      if (signUpError) {
        throw signUpError;
      }

      // Check if user already exists (signUp returns user but identities is empty)
      if (signUpData?.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) {
        // User already exists, try sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: 'mockPassword123!',
        });

        if (signInError) {
          // Could not sign in - fall back to localStorage
          useSupabaseAuth = false;
          uid = fallbackUUID;
          console.warn('Supabase Auth sign-in unavailable, using localStorage fallback:', signInError.message);
        } else {
          uid = signInData.user?.id ?? fallbackUUID;
        }
      } else {
        uid = signUpData?.user?.id ?? fallbackUUID;
      }
    } catch (authError: unknown) {
      // Supabase not available or other error - fall back to localStorage
      useSupabaseAuth = false;
      uid = fallbackUUID;
      console.warn(
        'Supabase Auth unavailable, using localStorage fallback:',
        authError instanceof Error ? authError.message : authError
      );
    }

    // Store user role in Supabase or localStorage
    if (useSupabaseAuth) {
      try {
        await setUserRole(uid, trimmedEmail, mockRole);
      } catch (dbError) {
        console.warn('Supabase DB write failed, using localStorage:', dbError);
        useSupabaseAuth = false;
      }
    }

    // Dual-track auth: when Supabase Auth succeeded, write mockAuthUser to
    // localStorage so the AuthProvider immediately picks up the user for
    // role-based UI routing. The real Supabase session (stored internally
    // by supabase-js) provides the JWT for Realtime WebSocket auth.
    // When Supabase Auth failed, write mockAuthUser as a fallback so the
    // app still works without a live Supabase instance.
    localStorage.setItem(
      'mockAuthUser',
      JSON.stringify({ uid, email: trimmedEmail, role: mockRole })
    );

    // Notify AuthProvider so it can pick up the mock auth change immediately
    window.dispatchEvent(
      new CustomEvent('authStorageChange', {
        detail: { key: 'mockAuthUser' },
      })
    );
  } catch (error) {
    console.error('Error signing in with email link:', error);
    throw error;
  }
}

/**
 * Signs out the currently authenticated user
 * Clears auth state from Supabase and localStorage fallback
 *
 * @returns Promise that resolves when sign-out is complete
 * @throws Error if sign-out fails
 */
export async function signOut(): Promise<void> {
  try {
    // Clear localStorage mock auth
    localStorage.removeItem('mockAuthUser');

    // Dispatch custom event to notify AuthProvider of logout (for same-tab updates)
    window.dispatchEvent(
      new CustomEvent('authStorageChange', {
        detail: { key: 'mockAuthUser' },
      }),
    );

    // Try to sign out from Supabase (may fail if no live instance)
    try {
      await supabase.auth.signOut();
    } catch (supabaseError) {
      console.warn('Supabase sign-out failed (instance may not be connected):', supabaseError);
      // Continue - localStorage is already cleared
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
