/**
 * Profile Service - Supabase implementation
 * Handles profile CRUD operations with profile_role_tags junction table management.
 */

import { supabase } from '../../config/supabase';
import type { Profile } from '../../types';
import type { ProfileRow, ProfileRoleTagRow } from './mappers';
import { toProfile, toISO } from './mappers';
import type { Database } from '../../types/database.types';
import { createCrudService } from './crudFactory';
import { isValidUUID } from '../../utils/uuid';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileRoleTagInsert = Database['public']['Tables']['profile_role_tags']['Insert'];

// -- Factory-generated operations ------------------------------------------

const crud = createCrudService<Profile>({
  table: 'profiles',
  selectClause: '*, profile_role_tags(*)',
  mapRow: (row: any) =>
    toProfile(row as ProfileRow, ((row as any).profile_role_tags ?? []) as ProfileRoleTagRow[]),
  entityName: 'profile',
  subscription: {
    channelName: 'profiles-all',
    tables: [{ table: 'profiles' }, { table: 'profile_role_tags' }],
  },
});

export const listProfiles = crud.list;
export const getProfile = crud.get;
export const deleteProfile = crud.remove;
export const subscribeToProfiles = crud.subscribe;

// -- Custom operations -----------------------------------------------------

/**
 * Creates a new profile with role tags.
 */
export async function createProfile(
  name: string,
  description: string | undefined,
  roleTags: string[],
  createdBy: string
): Promise<Profile> {
  const now = toISO(Date.now());
  const trimmedName = name.trim();
  const trimmedDesc = description ? description.trim() : null;

  // Only pass createdBy if it's a valid UUID; otherwise use null.
  const safeCreatedBy = createdBy && isValidUUID(createdBy) ? createdBy : null;

  const row: ProfileInsert = {
    name: trimmedName,
    description: trimmedDesc,
    created_at: now,
    created_by: safeCreatedBy,
  };

  // Insert profile row
  const { data, error } = await supabase
    .from('profiles')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create profile: ${error?.message ?? 'No data returned'}`);
  }

  const newId = (data as ProfileRow).id;

  // Insert role tag rows
  if (roleTags.length > 0) {
    const tagRows: ProfileRoleTagInsert[] = roleTags.map((tag) => ({
      profile_id: newId,
      role_tag: tag,
    }));

    const { error: tagError } = await supabase
      .from('profile_role_tags')
      .insert(tagRows);

    if (tagError) {
      throw new Error(`Failed to create profile role tags: ${tagError.message}`);
    }
  }

  return {
    id: newId,
    name: trimmedName,
    description: trimmedDesc ?? undefined,
    roleTags,
    createdAt: new Date(now).getTime(),
    createdBy: safeCreatedBy ?? createdBy,
  };
}

/**
 * Updates an existing profile. If roleTags are included, uses delete+insert.
 */
export async function updateProfile(
  profileId: string,
  updates: { name?: string; description?: string; roleTags?: string[] }
): Promise<void> {
  const safeUpdates: Record<string, unknown> = {};

  if (updates.name) {
    safeUpdates.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    safeUpdates.description = updates.description ? updates.description.trim() : null;
  }

  if (Object.keys(safeUpdates).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', profileId);

    if (error) {
      throw new Error(`Failed to update profile ${profileId}: ${error.message}`);
    }
  }

  // Handle roleTags via delete+insert
  if (updates.roleTags) {
    const { error: deleteError } = await supabase
      .from('profile_role_tags')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
      throw new Error(`Failed to delete old profile role tags: ${deleteError.message}`);
    }

    if (updates.roleTags.length > 0) {
      const tagRows: ProfileRoleTagInsert[] = updates.roleTags.map((tag) => ({
        profile_id: profileId,
        role_tag: tag,
      }));

      const { error: insertError } = await supabase
        .from('profile_role_tags')
        .insert(tagRows);

      if (insertError) {
        throw new Error(`Failed to insert updated profile role tags: ${insertError.message}`);
      }
    }
  }
}
