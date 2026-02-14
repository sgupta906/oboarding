/**
 * Suggestion Service - Supabase implementation
 * Handles suggestion CRUD operations.
 */

import { supabase } from '../../config/supabase';
import type { Suggestion } from '../../types';
import type { SuggestionRow } from './mappers';
import { toSuggestion, toISO } from './mappers';
import type { Database } from '../../types/database.types';

type SuggestionInsert = Database['public']['Tables']['suggestions']['Insert'];

/**
 * Fetches all suggestions.
 */
export async function listSuggestions(): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch suggestions: ${error.message}`);
  }

  return ((data ?? []) as SuggestionRow[]).map(toSuggestion);
}

/**
 * Creates a new suggestion.
 * @returns The ID of the new suggestion row.
 */
export async function createSuggestion(
  suggestion: Omit<Suggestion, 'id' | 'createdAt'>
): Promise<string> {
  const row: SuggestionInsert = {
    step_id: suggestion.stepId,
    user_name: suggestion.user,
    text: suggestion.text,
    status: suggestion.status,
    created_at: toISO(Date.now()),
    instance_id: suggestion.instanceId ?? null,
  };

  const { data, error } = await supabase
    .from('suggestions')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create suggestion: ${error?.message ?? 'No data returned'}`);
  }

  return (data as SuggestionRow).id;
}

/**
 * Updates the status of a suggestion.
 */
export async function updateSuggestionStatus(
  id: string,
  status: 'pending' | 'reviewed' | 'implemented'
): Promise<void> {
  const { error } = await supabase
    .from('suggestions')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update suggestion status ${id}: ${error.message}`);
  }
}

/**
 * Deletes a suggestion permanently.
 */
export async function deleteSuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('suggestions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete suggestion ${id}: ${error.message}`);
  }
}
