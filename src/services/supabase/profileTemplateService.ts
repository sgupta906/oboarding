/**
 * Profile Template Service - Supabase implementation
 * Handles profile template CRUD operations with child step table management.
 */

import { supabase } from '../../config/supabase';
import type { ProfileTemplate, Step } from '../../types';
import type { ProfileTemplateRow, ProfileTemplateStepRow } from './mappers';
import { toProfileTemplate, toISO } from './mappers';
import type { Database } from '../../types/database.types';

type ProfileTemplateInsert = Database['public']['Tables']['profile_templates']['Insert'];
type ProfileTemplateStepInsert = Database['public']['Tables']['profile_template_steps']['Insert'];

/**
 * Fetches all profile templates, optionally filtered by profileId.
 */
export async function listProfileTemplates(profileId?: string): Promise<ProfileTemplate[]> {
  let query = supabase
    .from('profile_templates')
    .select('*, profile_template_steps(*)');

  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch profile templates: ${error.message}`);
  }

  return (data ?? []).map((row: any) =>
    toProfileTemplate(
      row as ProfileTemplateRow,
      ((row as any).profile_template_steps ?? []) as ProfileTemplateStepRow[]
    )
  );
}

/**
 * Fetches a single profile template by ID with its steps.
 */
export async function getProfileTemplate(id: string): Promise<ProfileTemplate | null> {
  const { data, error } = await supabase
    .from('profile_templates')
    .select('*, profile_template_steps(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch profile template ${id}: ${error.message}`);
  }

  return data
    ? toProfileTemplate(
        data as unknown as ProfileTemplateRow,
        ((data as any).profile_template_steps ?? []) as ProfileTemplateStepRow[]
      )
    : null;
}

/**
 * Creates a new profile template with steps.
 */
export async function createProfileTemplate(
  profileId: string,
  name: string,
  description: string | undefined,
  steps: Step[],
  createdBy: string
): Promise<ProfileTemplate> {
  const now = toISO(Date.now());
  const trimmedName = name.trim();
  const trimmedDesc = description ? description.trim() : null;

  const row: ProfileTemplateInsert = {
    profile_id: profileId,
    name: trimmedName,
    description: trimmedDesc,
    created_at: now,
    updated_at: now,
    created_by: createdBy,
    version: 1,
    is_published: false,
  };

  // Insert template row
  const { data, error } = await supabase
    .from('profile_templates')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create profile template: ${error?.message ?? 'No data returned'}`);
  }

  const newId = (data as ProfileTemplateRow).id;

  // Insert step rows
  if (steps.length > 0) {
    const stepRows: ProfileTemplateStepInsert[] = steps.map((step) => ({
      profile_template_id: newId,
      position: step.id,
      title: step.title,
      description: step.description,
      role: step.role,
      owner: step.owner,
      expert: step.expert,
      status: step.status,
      link: step.link || null,
    }));

    const { error: stepsError } = await supabase
      .from('profile_template_steps')
      .insert(stepRows);

    if (stepsError) {
      throw new Error(`Failed to create profile template steps: ${stepsError.message}`);
    }
  }

  return {
    id: newId,
    profileId,
    name: trimmedName,
    description: trimmedDesc ?? undefined,
    steps,
    createdAt: new Date(now).getTime(),
    updatedAt: new Date(now).getTime(),
    createdBy,
    version: 1,
    isPublished: false,
  };
}

/**
 * Updates an existing profile template. If steps changed, uses delete+insert.
 */
export async function updateProfileTemplate(
  templateId: string,
  updates: {
    name?: string;
    description?: string;
    steps?: Step[];
    isPublished?: boolean;
  }
): Promise<void> {
  const now = toISO(Date.now());
  const safeUpdates: Record<string, unknown> = {
    updated_at: now,
  };

  if (updates.name) {
    safeUpdates.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    safeUpdates.description = updates.description ? updates.description.trim() : null;
  }

  if (updates.isPublished !== undefined) {
    safeUpdates.is_published = updates.isPublished;
  }

  const { error: updateError } = await supabase
    .from('profile_templates')
    .update(safeUpdates)
    .eq('id', templateId);

  if (updateError) {
    throw new Error(`Failed to update profile template ${templateId}: ${updateError.message}`);
  }

  // If steps changed, delete old and insert new
  if (updates.steps) {
    const { error: deleteError } = await supabase
      .from('profile_template_steps')
      .delete()
      .eq('profile_template_id', templateId);

    if (deleteError) {
      throw new Error(`Failed to delete old profile template steps: ${deleteError.message}`);
    }

    if (updates.steps.length > 0) {
      const stepRows: ProfileTemplateStepInsert[] = updates.steps.map((step) => ({
        profile_template_id: templateId,
        position: step.id,
        title: step.title,
        description: step.description,
        role: step.role,
        owner: step.owner,
        expert: step.expert,
        status: step.status,
        link: step.link || null,
      }));

      const { error: insertError } = await supabase
        .from('profile_template_steps')
        .insert(stepRows);

      if (insertError) {
        throw new Error(`Failed to insert updated profile template steps: ${insertError.message}`);
      }
    }
  }
}

/**
 * Deletes a profile template. CASCADE in the database handles step deletion.
 */
export async function deleteProfileTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('profile_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to delete profile template ${templateId}: ${error.message}`);
  }
}

/**
 * Subscribes to real-time profile template updates for a specific profile.
 */
export function subscribeToProfileTemplates(
  profileId: string,
  callback: (templates: ProfileTemplate[]) => void
): () => void {
  // 1. Initial fetch
  listProfileTemplates(profileId).then(callback).catch(console.error);

  // 2. Listen for changes
  const channel = supabase
    .channel(`profile-templates-${profileId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profile_templates',
        filter: `profile_id=eq.${profileId}`,
      },
      () => {
        listProfileTemplates(profileId).then(callback).catch(console.error);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profile_template_steps' },
      () => {
        listProfileTemplates(profileId).then(callback).catch(console.error);
      }
    )
    .subscribe();

  // 3. Return cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}
