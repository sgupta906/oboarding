/**
 * Auth Credential Helpers (localStorage - dev mode only)
 *
 * Manages local auth credentials for dev-auth bypass mode.
 * In production, Supabase Auth handles authentication.
 */

import type { User } from '../../types';

const AUTH_CREDENTIALS_KEY = 'onboardinghub_auth_credentials';
const USERS_STORAGE_KEY = 'onboardinghub_users';
const TEST_MODE_FLAG = '__TEST_DISABLE_DEFAULT_SEEDING__';

/**
 * Adds a user to the auth credentials storage so they can sign in.
 * Development mode only - production will use Supabase Auth.
 */
export function addUserToAuthCredentials(
  email: string,
  role: string,
  userId: string
): void {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    const credentials = stored ? JSON.parse(stored) : [];

    const existingIndex = credentials.findIndex(
      (cred: { email: string }) =>
        cred.email.toLowerCase() === email.toLowerCase()
    );

    const userCredential = {
      email: email.toLowerCase(),
      role,
      uid: userId,
    };

    if (existingIndex >= 0) {
      credentials[existingIndex] = userCredential;
    } else {
      credentials.push(userCredential);
    }

    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to add user to auth credentials:', error);
  }
}

/**
 * Gets the auth credential for a user by email.
 */
export function getAuthCredential(
  email: string
): { email: string; role: string; uid: string } | null {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    if (!stored) return null;

    const credentials = JSON.parse(stored);
    return (
      credentials.find(
        (cred: { email: string }) =>
          cred.email.toLowerCase() === email.toLowerCase()
      ) || null
    );
  } catch {
    return null;
  }
}

/**
 * Removes a user from auth credentials storage.
 */
export function removeUserFromAuthCredentials(email: string): void {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    if (!stored) return;

    let credentials: any[] = [];
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        console.warn(
          'Invalid auth credentials format (not an array), reinitializing'
        );
        localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify([]));
        return;
      }
      credentials = parsed;
    } catch (parseError) {
      console.warn(
        'Corrupted auth credentials in localStorage, reinitializing:',
        parseError
      );
      localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify([]));
      return;
    }

    const updatedCredentials = credentials.filter(
      (cred: any) =>
        !cred ||
        !cred.email ||
        cred.email.toLowerCase() !== email.toLowerCase()
    );

    if (updatedCredentials.length !== credentials.length) {
      localStorage.setItem(
        AUTH_CREDENTIALS_KEY,
        JSON.stringify(updatedCredentials)
      );
    }
  } catch (error) {
    console.error('Failed to remove user from auth credentials:', error);
  }
}

// ============================================================================
// Test Helpers (preserved for test setup.ts)
// ============================================================================

/**
 * Saves users to localStorage (exported for testing purposes).
 */
export function saveLocalUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(
      new CustomEvent('usersStorageChange', { detail: users })
    );
  } catch (error) {
    console.error('Failed to save users to localStorage:', error);
  }
}

/**
 * TEST HELPER: Enables or disables auto-seeding of DEFAULT_USERS.
 */
export function setDisableDefaultUserSeeding(disable: boolean): void {
  if (disable) {
    localStorage.setItem(TEST_MODE_FLAG, 'true');
  } else {
    localStorage.removeItem(TEST_MODE_FLAG);
  }
}

/**
 * TEST HELPER: Clears all users from localStorage and auth credentials.
 */
export function clearAllUsersForTesting(): void {
  localStorage.setItem(TEST_MODE_FLAG, 'true');
  localStorage.removeItem(USERS_STORAGE_KEY);
  localStorage.removeItem(AUTH_CREDENTIALS_KEY);
  localStorage.removeItem('onboardinghub_onboarding_instances');
  localStorage.removeItem('onboardinghub_suggestions');
  localStorage.removeItem('onboardinghub_experts');
  localStorage.removeItem('onboardinghub_activities');
}
