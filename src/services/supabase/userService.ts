/**
 * User Service - Supabase implementation
 * Handles user CRUD with junction tables (user_roles, user_profiles)
 * and real-time subscriptions.
 */

import { supabase } from '../../config/supabase';
import type { User } from '../../types';
import type { UserRow, UserRoleRow, UserProfileRow } from './mappers';
import { toUser, toISO } from './mappers';
import type { Database } from '../../types/database.types';
import { createCrudService } from './crudFactory';
import { isValidUUID } from '../../utils/uuid';
import {
  addUserToAuthCredentials,
  getAuthCredential,
  removeUserFromAuthCredentials,
  saveLocalUsers,
  setDisableDefaultUserSeeding,
  clearAllUsersForTesting,
} from './authCredentialHelpers';

// Re-export auth credential helpers for backward compatibility
export {
  addUserToAuthCredentials,
  getAuthCredential,
  removeUserFromAuthCredentials,
  saveLocalUsers,
  setDisableDefaultUserSeeding,
  clearAllUsersForTesting,
};

type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];

// ============================================================================
// Factory-generated operations
// ============================================================================

const crud = createCrudService<User>({
  table: 'users',
  selectClause: '*, user_roles(*), user_profiles(*)',
  mapRow: (row: any) =>
    toUser(
      row as UserRow,
      ((row as any).user_roles ?? []) as UserRoleRow[],
      ((row as any).user_profiles ?? []) as UserProfileRow[]
    ),
  entityName: 'user',
  subscription: {
    channelName: 'users-all',
    tables: [{ table: 'users' }, { table: 'user_roles' }, { table: 'user_profiles' }],
  },
});

export const listUsers = crud.list;
export const getUser = crud.get;
export const subscribeToUsers = crud.subscribe;

// ============================================================================
// CRUD Operations (Custom)
// ============================================================================

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
 * Checks if a user with the given ID exists in the users table.
 * Used to validate `created_by` FK references before INSERT operations.
 * Returns false on query error (fail-safe: treat as non-existent rather
 * than failing the entire create operation for an informational field).
 */
export async function creatorExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .limit(1);

  if (error) return false;
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

  // Only pass createdBy if it's a valid UUID AND the creator row exists;
  // otherwise use null. Dev auth generates UUIDs that may not have a
  // corresponding users row, which would cause an FK constraint violation.
  let safeCreatedBy: string | null = null;
  if (createdBy && isValidUUID(createdBy)) {
    const exists = await creatorExists(createdBy);
    safeCreatedBy = exists ? createdBy : null;
  }

  // Insert user row
  const row: UserInsert = {
    email: trimmedEmail,
    name: trimmedName,
    created_at: now,
    updated_at: now,
    created_by: safeCreatedBy,
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
    createdBy: safeCreatedBy ?? createdBy,
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
 * Deletes a user. Database CASCADE handles junction table cleanup
 * (user_roles, user_profiles). Also removes auth credentials.
 * Onboarding instances are NOT deleted -- they are separate entities.
 */
export async function deleteUser(userId: string): Promise<void> {
  // Fetch user to get email for auth credential cleanup
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
