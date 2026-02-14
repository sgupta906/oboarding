/**
 * Supabase Client Configuration
 *
 * Initializes a typed Supabase client for the OnboardingHub application.
 * This module mirrors the pattern established in `firebase.ts` -- both
 * read from VITE_* environment variables and export a configured client.
 *
 * The client is typed with the Database interface so that all queries
 * (e.g. `supabase.from('users').select()`) are fully type-checked.
 *
 * Environment variables (set in .env.local, sourced from Supabase project settings):
 *   VITE_SUPABASE_URL      - The Supabase project URL (e.g. http://127.0.0.1:54321)
 *   VITE_SUPABASE_ANON_KEY - The Supabase anonymous/public API key
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file. ' +
    'See .env.template for reference values.'
  );
}

/** Typed Supabase client instance for the OnboardingHub database. */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
