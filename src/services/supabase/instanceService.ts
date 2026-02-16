/**
 * Instance Service - Supabase implementation
 * Handles onboarding instance CRUD operations with child step table management,
 * step status updates, creating runs from templates, and multiple subscription types.
 */

import { supabase } from '../../config/supabase';
import type { OnboardingInstance, Step, StepStatus } from '../../types';
import type { InstanceRow, InstanceStepRow } from './mappers';
import { toInstance, toStep, toISO } from './mappers';
import type { Database } from '../../types/database.types';
import { debounce } from '../../utils/debounce';
import { createCrudService } from './crudFactory';

type InstanceInsert = Database['public']['Tables']['onboarding_instances']['Insert'];
type InstanceStepInsert = Database['public']['Tables']['instance_steps']['Insert'];

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation error class for onboarding run creation.
 */
export class OnboardingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnboardingValidationError';
  }
}

/**
 * Employee data required for creating an onboarding run.
 */
export interface CreateOnboardingRunInput {
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  templateId: string;
  startDate?: number; // Optional Unix timestamp
}

// ============================================================================
// Factory-generated operations
// ============================================================================

const crud = createCrudService<OnboardingInstance>({
  table: 'onboarding_instances',
  selectClause: '*, instance_steps(*)',
  mapRow: (row: any) =>
    toInstance(row as InstanceRow, ((row as any).instance_steps ?? []) as InstanceStepRow[]),
  entityName: 'onboarding instance',
  subscription: {
    channelName: 'instances-all',
    tables: [{ table: 'onboarding_instances' }, { table: 'instance_steps' }],
  },
});

export const listOnboardingInstances = crud.list;
export const getOnboardingInstance = crud.get;
export const subscribeToOnboardingInstances = crud.subscribe;

// ============================================================================
// CRUD Operations (Custom)
// ============================================================================

/**
 * Creates a new onboarding instance with steps.
 * @returns The ID of the new instance.
 */
export async function createOnboardingInstance(
  instance: Omit<OnboardingInstance, 'id' | 'createdAt'>
): Promise<string> {
  const now = toISO(Date.now());

  const row: InstanceInsert = {
    employee_name: instance.employeeName,
    employee_email: instance.employeeEmail,
    role: instance.role,
    department: instance.department,
    template_id: instance.templateId || null,
    progress: instance.progress,
    status: instance.status,
    created_at: now,
    start_date: instance.startDate ? toISO(instance.startDate) : null,
    completed_at: instance.completedAt ? toISO(instance.completedAt) : null,
    template_snapshots: instance.templateSnapshots as any ?? null,
  };

  // Insert instance row
  const { data, error } = await supabase
    .from('onboarding_instances')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create onboarding instance: ${error?.message ?? 'No data returned'}`);
  }

  const newId = (data as InstanceRow).id;

  // Insert step rows
  if (instance.steps && instance.steps.length > 0) {
    const stepRows: InstanceStepInsert[] = instance.steps.map((step) => ({
      instance_id: newId,
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
      .from('instance_steps')
      .insert(stepRows);

    if (stepsError) {
      throw new Error(`Failed to create instance steps: ${stepsError.message}`);
    }
  }

  return newId;
}

/**
 * Updates an existing onboarding instance.
 * If steps are included, uses delete+insert for the child table.
 */
export async function updateOnboardingInstance(
  id: string,
  updates: Partial<OnboardingInstance>
): Promise<void> {
  // Build safe updates for the instance row
  const { id: _, createdAt: __, steps: ___, ...rest } = updates;
  const safeUpdates: Record<string, unknown> = {};

  if (rest.employeeName !== undefined) safeUpdates.employee_name = rest.employeeName;
  if (rest.employeeEmail !== undefined) safeUpdates.employee_email = rest.employeeEmail;
  if (rest.role !== undefined) safeUpdates.role = rest.role;
  if (rest.department !== undefined) safeUpdates.department = rest.department;
  if (rest.templateId !== undefined) safeUpdates.template_id = rest.templateId;
  if (rest.progress !== undefined) safeUpdates.progress = rest.progress;
  if (rest.status !== undefined) safeUpdates.status = rest.status;
  if (rest.startDate !== undefined) safeUpdates.start_date = rest.startDate ? toISO(rest.startDate) : null;
  if (rest.completedAt !== undefined) safeUpdates.completed_at = rest.completedAt ? toISO(rest.completedAt) : null;
  if (rest.templateSnapshots !== undefined) safeUpdates.template_snapshots = rest.templateSnapshots;

  if (Object.keys(safeUpdates).length > 0) {
    const { error } = await supabase
      .from('onboarding_instances')
      .update(safeUpdates)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update onboarding instance ${id}: ${error.message}`);
    }
  }

  // If steps changed, delete old and insert new
  if (updates.steps) {
    const { error: deleteError } = await supabase
      .from('instance_steps')
      .delete()
      .eq('instance_id', id);

    if (deleteError) {
      throw new Error(`Failed to delete old instance steps: ${deleteError.message}`);
    }

    if (updates.steps.length > 0) {
      const stepRows: InstanceStepInsert[] = updates.steps.map((step) => ({
        instance_id: id,
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
        .from('instance_steps')
        .insert(stepRows);

      if (insertError) {
        throw new Error(`Failed to insert updated instance steps: ${insertError.message}`);
      }
    }
  }
}

/**
 * Updates the status of a step inside an onboarding instance and recalculates progress.
 * Uses direct UPDATE queries instead of fetch-rebuild-delete-insert.
 * 3 targeted queries instead of 4+ broad queries.
 */
export async function updateStepStatus(
  instanceId: string,
  stepId: number,
  status: StepStatus
): Promise<void> {
  // Step 1: Update the specific step row directly
  const { data: updatedRows, error: stepError } = await supabase
    .from('instance_steps')
    .update({ status })
    .eq('instance_id', instanceId)
    .eq('position', stepId)
    .select('position');

  if (stepError) {
    throw new Error(`Failed to update step status: ${stepError.message}`);
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error(
      `Step with position ${stepId} not found in onboarding instance ${instanceId}.`
    );
  }

  // Step 2: Recalculate progress from all steps
  const { data: allSteps, error: fetchError } = await supabase
    .from('instance_steps')
    .select('status')
    .eq('instance_id', instanceId);

  if (fetchError) {
    throw new Error(`Failed to fetch steps for progress calculation: ${fetchError.message}`);
  }

  const stepsList = allSteps ?? [];
  const completedCount = stepsList.filter(s => s.status === 'completed').length;
  const progress = stepsList.length === 0
    ? 0
    : Math.round((completedCount / stepsList.length) * 100);

  // Step 3: Update instance progress (and status/completed_at if 100%)
  const instanceUpdates: Record<string, unknown> = { progress };
  if (progress === 100) {
    instanceUpdates.status = 'completed';
    instanceUpdates.completed_at = new Date().toISOString();
  } else {
    instanceUpdates.status = 'active';
    instanceUpdates.completed_at = null;
  }

  const { error: progressError } = await supabase
    .from('onboarding_instances')
    .update(instanceUpdates)
    .eq('id', instanceId);

  if (progressError) {
    throw new Error(`Failed to update instance progress: ${progressError.message}`);
  }
}

// ============================================================================
// Create Onboarding Run from Template
// ============================================================================

/**
 * Validates that all required employee data fields are present and valid.
 */
function validateEmployeeData(data: CreateOnboardingRunInput): void {
  const isValidString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

  if (!isValidString(data.employeeName)) {
    throw new OnboardingValidationError(
      'employeeName is required and must be a non-empty string'
    );
  }

  if (!isValidString(data.employeeEmail)) {
    throw new OnboardingValidationError(
      'employeeEmail is required and must be a non-empty string'
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.employeeEmail)) {
    throw new OnboardingValidationError(
      `employeeEmail must be a valid email address, got: ${data.employeeEmail}`
    );
  }

  if (!isValidString(data.role)) {
    throw new OnboardingValidationError(
      'role is required and must be a non-empty string'
    );
  }

  if (!isValidString(data.department)) {
    throw new OnboardingValidationError(
      'department is required and must be a non-empty string'
    );
  }

  if (!isValidString(data.templateId)) {
    throw new OnboardingValidationError(
      'templateId is required and must be a non-empty string'
    );
  }

  if (data.startDate !== undefined) {
    if (typeof data.startDate !== 'number' || data.startDate < 0) {
      throw new OnboardingValidationError(
        'startDate must be a valid Unix timestamp (non-negative number)'
      );
    }
  }
}

/**
 * Creates a new onboarding instance from a template.
 */
export async function createOnboardingRunFromTemplate(
  employeeData: CreateOnboardingRunInput
): Promise<OnboardingInstance> {
  // Step 1: Validate
  validateEmployeeData(employeeData);

  // Step 2: Fetch the template (lazy import to avoid circular dep at load time)
  const { getTemplate } = await import('./templateService');
  const template = await getTemplate(employeeData.templateId);
  if (!template) {
    throw new OnboardingValidationError(
      `Template not found: ${employeeData.templateId}. Cannot create onboarding run without a valid template.`
    );
  }

  // Step 3: Create the instance
  const normalizedEmail = employeeData.employeeEmail.toLowerCase().trim();
  const newInstanceData: Omit<OnboardingInstance, 'id'> = {
    employeeName: employeeData.employeeName,
    employeeEmail: normalizedEmail,
    role: employeeData.role,
    department: employeeData.department,
    templateId: employeeData.templateId,
    steps: template.steps,
    createdAt: Date.now(),
    startDate: employeeData.startDate,
    progress: 0,
    status: 'active' as const,
  };

  const instanceId = await createOnboardingInstance(newInstanceData);

  // Step 4: Add auth credentials and ensure user record
  // Lazy import to avoid circular dep
  const { addUserToAuthCredentials, userEmailExists, createUser } = await import('./userService');
  addUserToAuthCredentials(normalizedEmail, 'employee', instanceId);

  try {
    const exists = await userEmailExists(normalizedEmail);
    if (!exists) {
      await createUser(
        {
          email: normalizedEmail,
          name: employeeData.employeeName,
          roles: ['employee'],
          profiles: employeeData.department ? [employeeData.department] : [],
          createdBy: 'system',
        },
        'system'
      );
    }
  } catch (err) {
    console.warn('Failed to ensure user record for onboarding:', err);
  }

  return {
    id: instanceId,
    ...newInstanceData,
  };
}

// ============================================================================
// Subscriptions (Custom -- filtered by ID/email)
// ============================================================================

/**
 * Subscribes to a specific onboarding instance.
 */
export function subscribeToOnboardingInstance(
  instanceId: string,
  callback: (instance: OnboardingInstance | null) => void
): () => void {
  // Debounced re-fetch to batch rapid Realtime events
  const debouncedRefetch = debounce(() => {
    getOnboardingInstance(instanceId).then(callback).catch(console.error);
  }, 300);

  // 1. Initial fetch (NOT debounced -- immediate)
  getOnboardingInstance(instanceId).then(callback).catch(console.error);

  // 2. Listen for changes with debounced handler
  const channel = supabase
    .channel(`instance-${instanceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'onboarding_instances',
        filter: `id=eq.${instanceId}`,
      },
      () => {
        debouncedRefetch();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'instance_steps',
        filter: `instance_id=eq.${instanceId}`,
      },
      () => {
        debouncedRefetch();
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.debug(`[Realtime] Channel instance-${instanceId} subscribed`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Channel instance-${instanceId} error`);
      } else if (status === 'TIMED_OUT') {
        console.error(`[Realtime] Channel instance-${instanceId} timed out`);
      } else if (status === 'CLOSED') {
        console.warn(`[Realtime] Channel instance-${instanceId} closed`);
      }
    });

  return () => {
    debouncedRefetch.cancel();
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to steps of a specific onboarding instance.
 */
export function subscribeToSteps(
  instanceId: string,
  callback: (steps: Step[]) => void
): () => void {
  // Helper: fetch steps directly from instance_steps table (no full instance fetch)
  const fetchSteps = async (): Promise<Step[]> => {
    const { data, error } = await supabase
      .from('instance_steps')
      .select('*')
      .eq('instance_id', instanceId)
      .order('position', { ascending: true });

    if (error) {
      console.error(`Failed to fetch steps: ${error.message}`);
      return [];
    }

    return ((data ?? []) as InstanceStepRow[]).map(toStep);
  };

  // Debounced re-fetch to batch rapid Realtime events
  const debouncedRefetch = debounce(() => {
    fetchSteps().then(callback).catch(console.error);
  }, 300);

  // 1. Initial fetch (NOT debounced -- immediate)
  fetchSteps().then(callback).catch(console.error);

  // 2. Listen for changes on instance_steps only (no need for parent table)
  const channel = supabase
    .channel(`instance-steps-${instanceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'instance_steps',
        filter: `instance_id=eq.${instanceId}`,
      },
      () => {
        debouncedRefetch();
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.debug(`[Realtime] Channel instance-steps-${instanceId} subscribed`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Channel instance-steps-${instanceId} error`);
      } else if (status === 'TIMED_OUT') {
        console.error(`[Realtime] Channel instance-steps-${instanceId} timed out`);
      } else if (status === 'CLOSED') {
        console.warn(`[Realtime] Channel instance-steps-${instanceId} closed`);
      }
    });

  return () => {
    debouncedRefetch.cancel();
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to the onboarding instance for a specific employee email.
 * Returns the most recent instance for that email.
 */
export function subscribeToEmployeeInstance(
  email: string,
  callback: (instance: OnboardingInstance | null) => void
): () => void {
  const normalizedEmail = email.toLowerCase();

  // Helper: find the most recent instance for this employee
  const fetchEmployeeInstance = async () => {
    const { data, error } = await supabase
      .from('onboarding_instances')
      .select('*, instance_steps(*)')
      .eq('employee_email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Failed to fetch employee instance: ${error.message}`);
      return null;
    }

    if (!data || data.length === 0) return null;

    const row: any = data[0];
    return toInstance(
      row as InstanceRow,
      ((row as any).instance_steps ?? []) as InstanceStepRow[]
    );
  };

  // Debounced re-fetch to batch rapid Realtime events
  const debouncedRefetch = debounce(() => {
    fetchEmployeeInstance().then(callback).catch(console.error);
  }, 300);

  // 1. Initial fetch (NOT debounced -- immediate)
  fetchEmployeeInstance().then(callback).catch(console.error);

  // 2. Listen for changes with debounced handler
  const channel = supabase
    .channel(`employee-instance-${normalizedEmail}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'onboarding_instances', filter: `employee_email=eq.${normalizedEmail}` },
      () => {
        debouncedRefetch();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'instance_steps' },
      () => {
        debouncedRefetch();
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.debug(`[Realtime] Channel employee-instance-${normalizedEmail} subscribed`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Channel employee-instance-${normalizedEmail} error`);
      } else if (status === 'TIMED_OUT') {
        console.error(`[Realtime] Channel employee-instance-${normalizedEmail} timed out`);
      } else if (status === 'CLOSED') {
        console.warn(`[Realtime] Channel employee-instance-${normalizedEmail} closed`);
      }
    });

  return () => {
    debouncedRefetch.cancel();
    supabase.removeChannel(channel);
  };
}
