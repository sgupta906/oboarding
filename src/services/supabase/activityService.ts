/**
 * Activity Service - Supabase implementation
 * Handles activity log CRUD operations and real-time subscriptions.
 */

import { supabase } from '../../config/supabase';
import type { Activity } from '../../types';
import type { ActivityRow } from './mappers';
import { toActivity, toISO } from './mappers';
import type { Database } from '../../types/database.types';

type ActivityInsert = Database['public']['Tables']['activities']['Insert'];

/**
 * Fetches all activities.
 */
export async function listActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch activities: ${error.message}`);
  }

  return ((data ?? []) as ActivityRow[]).map(toActivity);
}

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

/**
 * Subscribes to real-time activity updates.
 * Fetches initial data then re-fetches on every change.
 * @returns Cleanup function to remove the channel.
 */
export function subscribeToActivities(
  callback: (activities: Activity[]) => void
): () => void {
  // 1. Initial fetch
  listActivities().then(callback).catch(console.error);

  // 2. Listen for changes
  const channel = supabase
    .channel('activities-all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activities' },
      () => {
        listActivities().then(callback).catch(console.error);
      }
    )
    .subscribe();

  // 3. Return cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}
