/**
 * User Service - Supabase implementation
 * Handles user CRUD with junction tables (user_roles, user_profiles),
 * auth credential helpers (localStorage for dev mode),
 * and real-time subscriptions.
 */

import { supabase } from '../../config/supabase';
import type { User, Activity } from '../../types';
import type { UserRow, UserRoleRow, UserProfileRow } from './mappers';
import { toUser, toISO } from './mappers';
import type { Database } from '../../types/database.types';

type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];

// ============================================================================
// Auth Credential Helpers (localStorage - dev mode only)
// ============================================================================

const AUTH_CREDENTIALS_KEY = 'onboardinghub_auth_credentials';
const USERS_STORAGE_KEY = 'onboardinghub_users';
const TEST_MODE_FLAG = '__TEST_DISABLE_DEFAULT_SEEDING__';

/**
 * Adds a user to the auth credentials storage so they can sign in.
 * Development mode only - production will use Supabase Auth.
 */
export function addUserToAuthCredentials(email: string, role: string, userId: string): void {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    const credentials = stored ? JSON.parse(stored) : [];

    const existingIndex = credentials.findIndex(
      (cred: { email: string }) => cred.email.toLowerCase() === email.toLowerCase()
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
export function getAuthCredential(email: string): { email: string; role: string; uid: string } | null {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    if (!stored) return null;

    const credentials = JSON.parse(stored);
    return credentials.find(
      (cred: { email: string }) => cred.email.toLowerCase() === email.toLowerCase()
    ) || null;
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
        console.warn('Invalid auth credentials format (not an array), reinitializing');
        localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify([]));
        return;
      }
      credentials = parsed;
    } catch (parseError) {
      console.warn('Corrupted auth credentials in localStorage, reinitializing:', parseError);
      localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify([]));
      return;
    }

    const updatedCredentials = credentials.filter(
      (cred: any) => !cred || !cred.email || cred.email.toLowerCase() !== email.toLowerCase()
    );

    if (updatedCredentials.length !== credentials.length) {
      localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
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
    window.dispatchEvent(new CustomEvent('usersStorageChange', { detail: users }));
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

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Fetches all users with their roles and profiles.
 */
export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*, user_roles(*), user_profiles(*)');

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return (data ?? []).map((row: any) =>
    toUser(
      row as UserRow,
      ((row as any).user_roles ?? []) as UserRoleRow[],
      ((row as any).user_profiles ?? []) as UserProfileRow[]
    )
  );
}

/**
 * Fetches a single user by ID with junction data.
 */
export async function getUser(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*, user_roles(*), user_profiles(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch user ${id}: ${error.message}`);
  }

  return data
    ? toUser(
        data as unknown as UserRow,
        ((data as any).user_roles ?? []) as UserRoleRow[],
        ((data as any).user_profiles ?? []) as UserProfileRow[]
      )
    : null;
}

/**
 * Checks if a user email already exists (case-insensitive).
 */
export async function userEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  let query = supabase
    .from('users')
    .select('id')
    .ilike('email', normalizedEmail);

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw new Error(`Failed to check user email existence: ${error.message}`);
  }

  return (data ?? []).length > 0;
}

/**
 * Creates a new user with junction table rows.
 * @throws Error if email already exists.
 */
export async function createUser(
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<User> {
  const emailExists = await userEmailExists(userData.email);
  if (emailExists) {
    throw new Error(`A user with email ${userData.email} already exists`);
  }

  const now = toISO(Date.now());
  const trimmedEmail = userData.email.toLowerCase().trim();
  const trimmedName = userData.name.trim();
  const primaryRole = userData.roles[0] || 'employee';

  // Insert user row
  const row: UserInsert = {
    email: trimmedEmail,
    name: trimmedName,
    created_at: now,
    updated_at: now,
    created_by: createdBy,
  };

  const { data, error } = await supabase
    .from('users')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create user: ${error?.message ?? 'No data returned'}`);
  }

  const newId = (data as UserRow).id;

  // Insert user_roles junction rows
  if (userData.roles.length > 0) {
    const roleRows: UserRoleInsert[] = userData.roles.map((roleName) => ({
      user_id: newId,
      role_name: roleName,
    }));

    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert(roleRows);

    if (rolesError) {
      throw new Error(`Failed to create user roles: ${rolesError.message}`);
    }
  }

  // Insert user_profiles junction rows
  const profiles = userData.profiles ?? [];
  if (profiles.length > 0) {
    const profileRows: UserProfileInsert[] = profiles.map((profileName) => ({
      user_id: newId,
      profile_name: profileName,
    }));

    const { error: profilesError } = await supabase
      .from('user_profiles')
      .insert(profileRows);

    if (profilesError) {
      throw new Error(`Failed to create user profiles: ${profilesError.message}`);
    }
  }

  // Add to auth credentials for sign-in (dev mode)
  addUserToAuthCredentials(trimmedEmail, primaryRole, newId);

  return {
    id: newId,
    email: trimmedEmail,
    name: trimmedName,
    roles: userData.roles,
    profiles: profiles,
    createdAt: new Date(now).getTime(),
    updatedAt: new Date(now).getTime(),
    createdBy,
  };
}

/**
 * Updates an existing user. Manages junction tables via delete+insert.
 * @throws Error if updated email would create a duplicate.
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const now = toISO(Date.now());

  if (updates.email) {
    const emailExists = await userEmailExists(updates.email, userId);
    if (emailExists) {
      throw new Error(`A user with email ${updates.email} already exists`);
    }
  }

  // Update user row
  const safeUpdates: Record<string, unknown> = { updated_at: now };

  if (updates.email) {
    safeUpdates.email = updates.email.toLowerCase().trim();
  }
  if (updates.name) {
    safeUpdates.name = updates.name.trim();
  }

  const { error } = await supabase
    .from('users')
    .update(safeUpdates)
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user ${userId}: ${error.message}`);
  }

  // Update roles junction if provided
  if (updates.roles !== undefined) {
    const { error: deleteRolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteRolesError) {
      throw new Error(`Failed to delete old user roles: ${deleteRolesError.message}`);
    }

    if (updates.roles.length > 0) {
      const roleRows: UserRoleInsert[] = updates.roles.map((roleName) => ({
        user_id: userId,
        role_name: roleName,
      }));

      const { error: insertRolesError } = await supabase
        .from('user_roles')
        .insert(roleRows);

      if (insertRolesError) {
        throw new Error(`Failed to insert updated user roles: ${insertRolesError.message}`);
      }
    }
  }

  // Update profiles junction if provided
  if (updates.profiles !== undefined) {
    const { error: deleteProfilesError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (deleteProfilesError) {
      throw new Error(`Failed to delete old user profiles: ${deleteProfilesError.message}`);
    }

    if (updates.profiles.length > 0) {
      const profileRows: UserProfileInsert[] = updates.profiles.map((profileName) => ({
        user_id: userId,
        profile_name: profileName,
      }));

      const { error: insertProfilesError } = await supabase
        .from('user_profiles')
        .insert(profileRows);

      if (insertProfilesError) {
        throw new Error(`Failed to insert updated user profiles: ${insertProfilesError.message}`);
      }
    }
  }
}

/**
 * Deletes a user. Database CASCADE handles junction table cleanup.
 * Also removes auth credentials.
 */
export async function deleteUser(userId: string): Promise<void> {
  // Fetch user to get email for auth cleanup
  const user = await getUser(userId);
  if (!user) return; // Idempotent

  // Delete user row (CASCADE handles user_roles, user_profiles)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user ${userId}: ${error.message}`);
  }

  // Clean up auth credentials
  removeUserFromAuthCredentials(user.email);
}

/**
 * Deep equality check for User arrays.
 * Prevents infinite update loops in subscribeToUsers.
 */
export function areUsersEqual(users1: User[] | null, users2: User[]): boolean {
  if (users1 === null) return false;
  if (users1.length !== users2.length) return false;

  return users1.every((user1, index) => {
    const user2 = users2[index];
    return (
      user1.id === user2.id &&
      user1.email === user2.email &&
      user1.name === user2.name &&
      JSON.stringify(user1.roles) === JSON.stringify(user2.roles) &&
      JSON.stringify(user1.profiles) === JSON.stringify(user2.profiles) &&
      user1.createdAt === user2.createdAt &&
      user1.updatedAt === user2.updatedAt &&
      user1.createdBy === user2.createdBy
    );
  });
}

/**
 * Subscribes to real-time user updates.
 */
export function subscribeToUsers(
  callback: (users: User[]) => void
): () => void {
  // 1. Initial fetch
  listUsers().then(callback).catch(console.error);

  // 2. Listen for changes on users and junction tables
  const channel = supabase
    .channel('users-all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      () => {
        listUsers().then(callback).catch(console.error);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_roles' },
      () => {
        listUsers().then(callback).catch(console.error);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_profiles' },
      () => {
        listUsers().then(callback).catch(console.error);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Logs a user management activity. Delegates to activityService.
 */
export async function logActivity(
  activity: Omit<Activity, 'id' | 'timestamp'>
): Promise<void> {
  // Lazy import to avoid circular dependency
  const { logActivity: activityLogActivity } = await import('./activityService');
  await activityLogActivity(activity);
}
