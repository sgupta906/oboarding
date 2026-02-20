/**
 * Type Conversion Utilities for Supabase Data Layer
 *
 * Bridges the gap between Supabase database types (snake_case, ISO timestamps)
 * and application types (camelCase, Unix millisecond timestamps).
 *
 * All mapper functions are pure (no side effects, no imports of supabase client).
 */

import type { Database } from '../../types/database.types';
import type {
  Activity,
  CustomRole,
  OnboardingInstance,
  Step,
  Suggestion,
  Template,
  User,
} from '../../types';
import { formatTimeAgo } from '../../utils/timeUtils';

// ============================================================================
// Database Row Type Aliases (for readability)
// ============================================================================

type TemplateRow = Database['public']['Tables']['templates']['Row'];
type TemplateStepRow = Database['public']['Tables']['template_steps']['Row'];
type InstanceRow = Database['public']['Tables']['onboarding_instances']['Row'];
type InstanceStepRow = Database['public']['Tables']['instance_steps']['Row'];
type SuggestionRow = Database['public']['Tables']['suggestions']['Row'];
type ActivityRow = Database['public']['Tables']['activities']['Row'];
type RoleRow = Database['public']['Tables']['roles']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type UserRoleRow = Database['public']['Tables']['user_roles']['Row'];
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

// Re-export row types for use by service modules
export type {
  TemplateRow,
  TemplateStepRow,
  InstanceRow,
  InstanceStepRow,
  SuggestionRow,
  ActivityRow,
  RoleRow,
  UserRow,
  UserRoleRow,
  UserProfileRow,
};

// ============================================================================
// Timestamp Conversion Helpers
// ============================================================================

/**
 * Converts an ISO 8601 timestamp string to Unix milliseconds.
 * Returns 0 if the input is null or undefined.
 */
export function toUnixMs(isoString: string | null): number {
  if (!isoString) return 0;
  return new Date(isoString).getTime();
}

/**
 * Converts Unix milliseconds to an ISO 8601 timestamp string.
 */
export function toISO(unixMs: number): string {
  return new Date(unixMs).toISOString();
}

/**
 * Converts an ISO 8601 timestamp string to Unix milliseconds, or undefined if null.
 */
export function toOptionalUnixMs(isoString: string | null | undefined): number | undefined {
  if (isoString === null || isoString === undefined) return undefined;
  return new Date(isoString).getTime();
}

// ============================================================================
// Row-to-App Mappers
// ============================================================================

/**
 * Maps a step row (template_steps or instance_steps)
 * to an application Step type. The database `position` field becomes Step.id.
 */
export function toStep(row: TemplateStepRow | InstanceStepRow): Step {
  return {
    id: row.position,
    title: row.title,
    description: row.description,
    role: row.role,
    owner: row.owner,
    expert: row.expert,
    status: row.status as Step['status'],
    link: row.link ?? '',
  };
}

/**
 * Maps a templates row + its template_steps rows to an application Template type.
 * Steps are sorted by position (ascending).
 */
export function toTemplate(row: TemplateRow, stepRows: TemplateStepRow[]): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    role: row.role,
    steps: stepRows
      .sort((a, b) => a.position - b.position)
      .map(toStep),
    createdAt: toUnixMs(row.created_at),
    updatedAt: toOptionalUnixMs(row.updated_at),
    isActive: row.is_active,
  };
}

/**
 * Maps an onboarding_instances row + its instance_steps rows to an OnboardingInstance type.
 * Steps are sorted by position (ascending).
 */
export function toInstance(row: InstanceRow, stepRows: InstanceStepRow[]): OnboardingInstance {
  return {
    id: row.id,
    employeeName: row.employee_name,
    employeeEmail: row.employee_email,
    role: row.role,
    department: row.department,
    templateId: row.template_id ?? '',
    steps: stepRows
      .sort((a, b) => a.position - b.position)
      .map(toStep),
    createdAt: toUnixMs(row.created_at),
    updatedAt: toOptionalUnixMs(row.updated_at),
    startDate: toOptionalUnixMs(row.start_date),
    completedAt: toOptionalUnixMs(row.completed_at),
    progress: row.progress,
    status: row.status as OnboardingInstance['status'],
    templateSnapshots: row.template_snapshots as unknown as OnboardingInstance['templateSnapshots'],
  };
}

/**
 * Maps a suggestions row to an application Suggestion type.
 * Note: DB `user_name` maps to app `user`, DB `step_id` maps to app `stepId`.
 */
export function toSuggestion(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    stepId: row.step_id,
    user: row.user_name,
    text: row.text,
    status: row.status as Suggestion['status'],
    createdAt: toOptionalUnixMs(row.created_at),
    instanceId: row.instance_id ?? undefined,
  };
}

/**
 * Maps an activities row to an application Activity type.
 */
export function toActivity(row: ActivityRow): Activity {
  const timestamp = toOptionalUnixMs(row.timestamp);
  return {
    id: row.id,
    userInitials: row.user_initials,
    userName: row.user_name ?? undefined,
    action: row.action,
    timeAgo: formatTimeAgo(timestamp),
    timestamp,
    userId: row.user_id ?? undefined,
    resourceType: row.resource_type ?? undefined,
    resourceId: row.resource_id ?? undefined,
  };
}

/**
 * Maps a roles row to an application CustomRole type.
 */
export function toRole(row: RoleRow): CustomRole {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: toUnixMs(row.created_at),
    updatedAt: toUnixMs(row.updated_at),
    createdBy: row.created_by ?? 'Unknown',
  };
}

/**
 * Maps a users row + its user_roles and user_profiles junction rows
 * to an application User type.
 */
export function toUser(
  row: UserRow,
  roleRows: UserRoleRow[],
  profileRows: UserProfileRow[]
): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    roles: roleRows.map((r) => r.role_name),
    profiles: profileRows.map((p) => p.profile_name),
    createdAt: toUnixMs(row.created_at),
    updatedAt: toUnixMs(row.updated_at),
    createdBy: row.created_by ?? 'Unknown',
  };
}
