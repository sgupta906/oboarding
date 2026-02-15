/**
 * Activity Service - Supabase implementation
 * Handles activity log CRUD operations and real-time subscriptions.
 */

import { supabase } from '../../config/supabase';
import type { Activity } from '../../types';
import type { ActivityRow } from './mappers';
import { toActivity, toISO } from './mappers';
import type { Database } from '../../types/database.types';
import { createCrudService } from './crudFactory';

type ActivityInsert = Database['public']['Tables']['activities']['Insert'];

// -- Factory-generated operations ------------------------------------------

const crud = createCrudService<Activity>({
  table: 'activities',
  selectClause: '*',
  mapRow: (row) => toActivity(row as ActivityRow),
  entityName: 'activity',
  listLimit: 50,
  listOrder: { column: 'timestamp', ascending: false },
  subscription: {
    channelName: 'activities-all',
    tables: [{ table: 'activities' }],
  },
});

export const listActivities = crud.list;
export const subscribeToActivities = crud.subscribe;

// -- Custom operations -----------------------------------------------------

/**
 * Logs a new activity.
 * @returns The ID of the new activity row.
 */
export async function logActivity(
  activity: Omit<Activity, 'id' | 'timestamp'>
): Promise<string> {
  const row: ActivityInsert = {
    user_initials: activity.userInitials,
    action: activity.action,
    time_ago: activity.timeAgo,
    timestamp: toISO(Date.now()),
    user_id: activity.userId ?? null,
    resource_type: activity.resourceType ?? null,
    resource_id: activity.resourceId ?? null,
  };

  const { data, error } = await supabase
    .from('activities')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to log activity: ${error?.message ?? 'No data returned'}`);
  }

  return (data as ActivityRow).id;
}
