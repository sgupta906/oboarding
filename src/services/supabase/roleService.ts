/**
 * Role Service - Supabase implementation
 * Handles role CRUD operations, name validation, usage checks, and subscriptions.
 */

import { supabase } from '../../config/supabase';
import type { CustomRole } from '../../types';
import type { RoleRow } from './mappers';
import { toRole, toISO } from './mappers';
import type { Database } from '../../types/database.types';

type RoleInsert = Database['public']['Tables']['roles']['Insert'];

/**
 * Validates whether a string is a valid UUID v4 format.
 * Used to prevent inserting non-UUID strings into UUID columns.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Fetches all custom roles.
 */
export async function listRoles(): Promise<CustomRole[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch roles: ${error.message}`);
  }

  return ((data ?? []) as RoleRow[]).map(toRole);
}

/**
 * Fetches a single role by ID.
 */
export async function getRole(id: string): Promise<CustomRole | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch role ${id}: ${error.message}`);
  }

  return data ? toRole(data as RoleRow) : null;
}

/**
 * Checks if a role name already exists (case-insensitive).
 */
export async function roleNameExists(name: string): Promise<boolean> {
  const normalizedName = name.toLowerCase().trim();

  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .ilike('name', normalizedName)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check role name existence: ${error.message}`);
  }

  return (data ?? []).length > 0;
}

/**
 * Checks if a role is used in any templates or onboarding instances.
 */
export async function isRoleInUse(roleId: string): Promise<boolean> {
  const role = await getRole(roleId);
  if (!role) return false;

  // Check templates
  const { data: templateData, error: templateError } = await supabase
    .from('templates')
    .select('id')
    .eq('role', role.name)
    .limit(1);

  if (templateError) {
    throw new Error(`Failed to check role usage in templates: ${templateError.message}`);
  }

  if ((templateData ?? []).length > 0) return true;

  // Check onboarding instances
  const { data: instanceData, error: instanceError } = await supabase
    .from('onboarding_instances')
    .select('id')
    .eq('role', role.name)
    .limit(1);

  if (instanceError) {
    throw new Error(`Failed to check role usage in instances: ${instanceError.message}`);
  }

  return (instanceData ?? []).length > 0;
}

/**
 * Creates a new custom role.
 */
export async function createRole(
  name: string,
  description: string | undefined,
  createdBy: string | null
): Promise<CustomRole> {
  const now = toISO(Date.now());
  const trimmedName = name.trim();
  const trimmedDesc = description !== undefined ? description.trim() : null;

  // Only pass createdBy if it's a valid UUID; otherwise use null.
  // Dev auth generates non-UUID identifiers like "test-test-manager"
  // which would cause a Postgres type error on the UUID column.
  const safeCreatedBy = createdBy && isValidUUID(createdBy) ? createdBy : null;

  const row: RoleInsert = {
    name: trimmedName,
    description: trimmedDesc,
    created_at: now,
    updated_at: now,
    created_by: safeCreatedBy,
  };

  const { data, error } = await supabase
    .from('roles')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create role: ${error.message}`);
  }

  return toRole(data as RoleRow);
}

/**
 * Updates an existing role.
 */
export async function updateRole(
  roleId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  const now = toISO(Date.now());

  const safeUpdates: Record<string, unknown> = {
    updated_at: now,
  };

  if (updates.name) {
    safeUpdates.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    safeUpdates.description = updates.description.trim();
  }

  const { error } = await supabase
    .from('roles')
    .update(safeUpdates)
    .eq('id', roleId);

  if (error) {
    throw new Error(`Failed to update role ${roleId}: ${error.message}`);
  }
}

/**
 * Deletes a custom role. Checks if the role is in use first.
 */
export async function deleteRole(roleId: string): Promise<void> {
  const inUse = await isRoleInUse(roleId);
  if (inUse) {
    throw new Error(
      'Cannot delete role that is in use by templates or onboarding instances. Please update or delete those references first.'
    );
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', roleId);

  if (error) {
    throw new Error(`Failed to delete role ${roleId}: ${error.message}`);
  }
}

/**
 * Subscribes to real-time role updates.
 */
export function subscribeToRoles(
  callback: (roles: CustomRole[]) => void
): () => void {
  // 1. Initial fetch
  listRoles().then(callback).catch(console.error);

  // 2. Listen for changes
  const channel = supabase
    .channel('roles-all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'roles' },
      () => {
        listRoles().then(callback).catch(console.error);
      }
    )
    .subscribe();

  // 3. Return cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}
