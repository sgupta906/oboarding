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
import { createCrudService } from './crudFactory';

type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
type TemplateStepInsert = Database['public']['Tables']['template_steps']['Insert'];

// -- Factory-generated operations ------------------------------------------

const crud = createCrudService<Template>({
  table: 'templates',
  selectClause: '*, template_steps(*)',
  mapRow: (row: any) =>
    toTemplate(row as TemplateRow, ((row as any).template_steps ?? []) as TemplateStepRow[]),
  entityName: 'template',
  subscription: {
    channelName: 'templates-all',
    tables: [{ table: 'templates' }, { table: 'template_steps' }],
    shared: true,
  },
});

export const listTemplates = crud.list;
export const getTemplate = crud.get;
export const deleteTemplate = crud.remove;
export const subscribeToTemplates = crud.subscribe;

// -- Custom operations -----------------------------------------------------

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
 * Syncs template steps to all active onboarding instances using title-based matching.
 *
 * For each instance of the template:
 *   1. Builds a Map<title, instanceStep> from existing instance steps.
 *   2. Walks template steps in order:
 *      - Title match found: preserves instance step's `status`, updates all other
 *        fields (position, description, owner, expert, role, link) from the template.
 *      - No title match: adds as a new step with `status: 'pending'`.
 *   3. Orphan instance steps (title not in template) are dropped.
 *   4. Progress is recalculated as round(completedCount / totalSteps * 100).
 *
 * Only `status` is preserved from instance steps; all other fields are overwritten.
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
        // Build a title -> instance step lookup for status preservation
        const titleMap = new Map<string, Step>();
        for (const step of instance.steps) {
          titleMap.set(step.title, step);
        }

        // Walk template steps in order, merging with instance data
        const mergedSteps: Step[] = newSteps.map((templateStep, index) => {
          const existing = titleMap.get(templateStep.title);
          return {
            id: index + 1,
            title: templateStep.title,
            description: templateStep.description,
            role: templateStep.role,
            owner: templateStep.owner,
            expert: templateStep.expert,
            link: templateStep.link,
            status: existing ? existing.status : 'pending',
          };
        });

        // Calculate progress
        const completedCount = mergedSteps.filter((s) => s.status === 'completed').length;
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
