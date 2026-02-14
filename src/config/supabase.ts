/**
 * Supabase Client Configuration
 *
 * Initializes a typed Supabase client for the OnboardingHub application.
 * Reads from VITE_* environment variables and exports a configured client.
 *
 * The client is typed with the Database interface so that all queries
 * (e.g. `supabase.from('users').select()`) are fully type-checked.
 *
 * Environment variables (set in .env.local, sourced from Supabase project settings):
 *   VITE_SUPABASE_URL      - The Supabase project URL (e.g. http://127.0.0.1:54321)
 *   VITE_SUPABASE_ANON_KEY - The Supabase anonymous/public API key
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

let _supabase: SupabaseClient<Database> | null = null;

/**
 * Returns the typed Supabase client, creating it on first access.
 * Throws if VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are not set.
 * Lazy initialization prevents the error from firing at import time,
 * which is critical for test files that mock the supabase service layer.
 */
function getSupabaseClient(): SupabaseClient<Database> {
  if (!_supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. ' +
        'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file. ' +
        'See .env.template for reference values.'
      );
    }

    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/** Typed Supabase client instance for the OnboardingHub database. */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient(), prop, receiver);
  },
});
