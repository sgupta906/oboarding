/**
 * Profile Service - Supabase implementation
 * Handles profile CRUD operations with profile_role_tags junction table management.
 */

import { supabase } from '../../config/supabase';
import type { Profile } from '../../types';
import type { ProfileRow, ProfileRoleTagRow } from './mappers';
import { toProfile, toISO } from './mappers';
import type { Database } from '../../types/database.types';
import { debounce } from '../../utils/debounce';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileRoleTagInsert = Database['public']['Tables']['profile_role_tags']['Insert'];

/**
 * Fetches all profiles with their role tags.
 */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, profile_role_tags(*)')
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  return (data ?? []).map((row: any) =>
    toProfile(row as ProfileRow, ((row as any).profile_role_tags ?? []) as ProfileRoleTagRow[])
  );
}

/**
 * Fetches a single profile by ID with its role tags.
 */
export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, profile_role_tags(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch profile ${id}: ${error.message}`);
  }

  return data
    ? toProfile(data as unknown as ProfileRow, ((data as any).profile_role_tags ?? []) as ProfileRoleTagRow[])
    : null;
}

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

  const row: ProfileInsert = {
    name: trimmedName,
    description: trimmedDesc,
    created_at: now,
    created_by: createdBy,
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
    createdBy,
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

/**
 * Deletes a profile. CASCADE in the database handles role_tags deletion.
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (error) {
    throw new Error(`Failed to delete profile ${profileId}: ${error.message}`);
  }
}

/**
 * Subscribes to real-time profile updates.
 */
export function subscribeToProfiles(
  callback: (profiles: Profile[]) => void
): () => void {
  // Debounced re-fetch to batch rapid Realtime events
  const debouncedRefetch = debounce(() => {
    listProfiles().then(callback).catch(console.error);
  }, 300);

  // 1. Initial fetch (NOT debounced -- immediate)
  listProfiles().then(callback).catch(console.error);

  // 2. Listen for changes with debounced handler
  const channel = supabase
    .channel('profiles-all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => {
        debouncedRefetch();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profile_role_tags' },
      () => {
        debouncedRefetch();
      }
    )
    .subscribe();

  // 3. Return cleanup
  return () => {
    debouncedRefetch.cancel();
    supabase.removeChannel(channel);
  };
}
