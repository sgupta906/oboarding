/**
 * Template Service - Supabase implementation
 * Handles template CRUD operations with child step table management,
 * step-to-instance synchronization, and real-time subscriptions.
 */

import { supabase } from '../../config/supabase';
import type { Template, Step } from '../../types';
import type { TemplateRow, TemplateStepRow, InstanceRow, InstanceStepRow } from './mappers';
import { toTemplate, toInstance, toISO } from './mappers';
import type { Database } from '../../types/database.types';
import { debounce } from '../../utils/debounce';
import { createSharedSubscription } from './subscriptionManager';

type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
type TemplateStepInsert = Database['public']['Tables']['template_steps']['Insert'];

/**
 * Fetches all onboarding templates with their steps.
 */
export async function listTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*, template_steps(*)')
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return (data ?? []).map((row: any) =>
    toTemplate(row as TemplateRow, ((row as any).template_steps ?? []) as TemplateStepRow[])
  );
}

/**
 * Fetches a single template by ID with its steps.
 */
export async function getTemplate(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*, template_steps(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch template ${id}: ${error.message}`);
  }

  return data
    ? toTemplate(data as unknown as TemplateRow, ((data as any).template_steps ?? []) as TemplateStepRow[])
    : null;
}

/**
 * Creates a new template with steps.
 * @returns The ID of the new template.
 */
export async function createTemplate(
  template: Omit<Template, 'id' | 'createdAt'>
): Promise<string> {
  const now = toISO(Date.now());

  const row: TemplateInsert = {
    name: template.name,
    description: template.description,
    role: template.role,
    is_active: template.isActive,
    created_at: now,
    updated_at: now,
  };

  // Insert template row
  const { data: templateData, error: templateError } = await supabase
    .from('templates')
    .insert(row)
    .select()
    .single();

  if (templateError || !templateData) {
    throw new Error(`Failed to create template: ${templateError?.message ?? 'No data returned'}`);
  }

  const newId = (templateData as TemplateRow).id;

  // Insert step rows
  if (template.steps && template.steps.length > 0) {
    const stepRows: TemplateStepInsert[] = template.steps.map((step) => ({
      template_id: newId,
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
      .from('template_steps')
      .insert(stepRows);

    if (stepsError) {
      throw new Error(`Failed to create template steps: ${stepsError.message}`);
    }
  }

  return newId;
}

/**
 * Updates an existing template. If steps are included in the update,
 * old steps are deleted and new steps are inserted, then synced to instances.
 */
export async function updateTemplate(
  id: string,
  updates: Partial<Template>
): Promise<void> {
  const now = toISO(Date.now());

  // Build safe updates for the template row
  const safeUpdates: Record<string, unknown> = {
    updated_at: now,
  };

  if (updates.name !== undefined) safeUpdates.name = updates.name;
  if (updates.description !== undefined) safeUpdates.description = updates.description;
  if (updates.role !== undefined) safeUpdates.role = updates.role;
  if (updates.isActive !== undefined) safeUpdates.is_active = updates.isActive;

  const { error: updateError } = await supabase
    .from('templates')
    .update(safeUpdates)
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update template ${id}: ${updateError.message}`);
  }

  // If steps changed, delete old steps and insert new ones
  if (updates.steps) {
    // Delete existing steps
    const { error: deleteError } = await supabase
      .from('template_steps')
      .delete()
      .eq('template_id', id);

    if (deleteError) {
      throw new Error(`Failed to delete old template steps: ${deleteError.message}`);
    }

    // Insert new steps
    if (updates.steps.length > 0) {
      const stepRows: TemplateStepInsert[] = updates.steps.map((step) => ({
        template_id: id,
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
        .from('template_steps')
        .insert(stepRows);

      if (insertError) {
        throw new Error(`Failed to insert updated template steps: ${insertError.message}`);
      }
    }

    // Sync new steps to active onboarding instances
    await syncTemplateStepsToInstances(id, updates.steps);
  }
}

/**
 * Syncs new steps from an updated template to all active onboarding instances.
 * Only adds NEW steps that don't already exist in the instance.
 * Preserves existing step statuses.
 */
async function syncTemplateStepsToInstances(templateId: string, newSteps: Step[]): Promise<void> {
  try {
    // Lazy import to avoid circular dependency at module load time
    const { updateOnboardingInstance } = await import('./instanceService');

    // Fetch only instances using this template (not ALL instances)
    const { data, error } = await supabase
      .from('onboarding_instances')
      .select('*, instance_steps(*)')
      .eq('template_id', templateId);

    if (error) {
      throw new Error(`Failed to fetch instances for template ${templateId}: ${error.message}`);
    }

    const instances = (data ?? []).map((row: any) =>
      toInstance(row as InstanceRow, ((row as any).instance_steps ?? []) as InstanceStepRow[])
    );

    for (const instance of instances) {
      try {
        const existingStepIds = new Set(instance.steps.map((step) => step.id));
        const stepsToAdd = newSteps.filter((step) => !existingStepIds.has(step.id));

        if (stepsToAdd.length === 0) continue;

        const mergedSteps = [...instance.steps, ...stepsToAdd];
        const completedCount = mergedSteps.filter((step) => step.status === 'completed').length;
        const progress = mergedSteps.length === 0
          ? 0
          : Math.round((completedCount / mergedSteps.length) * 100);

        await updateOnboardingInstance(instance.id, {
          steps: mergedSteps,
          progress,
        });
      } catch (err) {
        console.warn(
          `Failed to sync template steps to instance ${instance.id}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  } catch (err) {
    console.warn(
      `Failed to sync template steps to instances for template ${templateId}:`,
      err instanceof Error ? err.message : String(err)
    );
  }
}

/**
 * Deletes a template. CASCADE in the database handles step deletion.
 */
export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete template ${id}: ${error.message}`);
  }
}

/**
 * Raw subscription to real-time template updates (used internally).
 * Listens on both templates and template_steps tables.
 */
function _subscribeToTemplatesRaw(
  callback: (templates: Template[]) => void
): () => void {
  // Debounced re-fetch to batch rapid Realtime events
  const debouncedRefetch = debounce(() => {
    listTemplates().then(callback).catch(console.error);
  }, 300);

  // 1. Initial fetch (NOT debounced -- immediate)
  listTemplates().then(callback).catch(console.error);

  // 2. Listen for changes on both tables with debounced handler
  const channel = supabase
    .channel('templates-all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'templates' },
      () => {
        debouncedRefetch();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'template_steps' },
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

/**
 * Shared subscription to real-time template updates.
 * Multiple callers share a single Supabase Realtime channel.
 */
const sharedTemplatesSubscription = createSharedSubscription<Template[]>(
  'templates',
  _subscribeToTemplatesRaw
);

/**
 * Subscribes to real-time template updates via shared subscription.
 * Multiple callers share one underlying Realtime channel.
 */
export function subscribeToTemplates(
  callback: (templates: Template[]) => void
): () => void {
  return sharedTemplatesSubscription.subscribe(callback);
}
