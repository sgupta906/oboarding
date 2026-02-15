/**
 * Role Service - Supabase implementation
 * Handles role CRUD operations, name validation, usage checks, and subscriptions.
 */

import { supabase } from '../../config/supabase';
import type { CustomRole } from '../../types';
import type { RoleRow } from './mappers';
import { toRole, toISO } from './mappers';
import type { Database } from '../../types/database.types';
import { createCrudService } from './crudFactory';

type RoleInsert = Database['public']['Tables']['roles']['Insert'];

/**
 * Validates whether a string is a valid UUID v4 format.
 * Used to prevent inserting non-UUID strings into UUID columns.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

// -- Factory-generated operations ------------------------------------------

const crud = createCrudService<CustomRole>({
  table: 'roles',
  selectClause: '*',
  mapRow: (row) => toRole(row as RoleRow),
  entityName: 'role',
  subscription: {
    channelName: 'roles-all',
    tables: [{ table: 'roles' }],
    shared: true,
  },
});

export const listRoles = crud.list;
export const getRole = crud.get;
export const subscribeToRoles = crud.subscribe;

// -- Custom operations -----------------------------------------------------

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

  // Check templates and instances in parallel
  const [templateResult, instanceResult] = await Promise.all([
    supabase.from('templates').select('id').eq('role', role.name).limit(1),
    supabase.from('onboarding_instances').select('id').eq('role', role.name).limit(1),
  ]);

  if (templateResult.error) {
    throw new Error(`Failed to check role usage in templates: ${templateResult.error.message}`);
  }

  if (instanceResult.error) {
    throw new Error(`Failed to check role usage in instances: ${instanceResult.error.message}`);
  }

  return (templateResult.data ?? []).length > 0 || (instanceResult.data ?? []).length > 0;
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
    // Handle unique constraint violation with a user-friendly message
    if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      throw new Error(`A role with name "${trimmedName}" already exists`);
    }
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
