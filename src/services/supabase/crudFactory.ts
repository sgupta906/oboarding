/**
 * CRUD Service Factory
 *
 * Creates standardized list/get/remove/subscribe operations for Supabase tables.
 * Each service file calls `createCrudService(config)` and re-exports the returned
 * operations under its original names, keeping custom operations (create, update,
 * business rules) as hand-written functions.
 *
 * This eliminates ~500 lines of duplicated boilerplate across 8 service files
 * while preserving identical public APIs through the barrel export (index.ts).
 */

import { supabase } from '../../config/supabase';
import { debounce } from '../../utils/debounce';
import { createSharedSubscription } from './subscriptionManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for a factory-generated CRUD service. */
export interface CrudServiceConfig<TApp> {
  /** Primary Supabase table name (e.g. 'roles', 'templates'). */
  table: string;

  /** PostgREST select clause (e.g. '*' or '*, template_steps(*)'). */
  selectClause: string;

  /** Maps a raw Supabase row (with any joined data) to the app-level type. */
  mapRow: (row: any) => TApp;

  /** Singular entity name for error messages (e.g. 'role', 'template'). */
  entityName: string;

  /** Maximum rows returned by list(). Defaults to 200. */
  listLimit?: number;

  /** Optional ordering for list() results. */
  listOrder?: { column: string; ascending: boolean };

  /** Realtime subscription configuration. Omit if the service has no standard subscription. */
  subscription?: {
    /** Supabase channel name (e.g. 'roles-all'). */
    channelName: string;

    /** Tables to listen on. Each entry can have an optional PostgREST filter. */
    tables: Array<{ table: string; filter?: string }>;

    /** When true, wraps the subscription with createSharedSubscription for ref-counting. */
    shared?: boolean;
  };
}

/** The standard operations returned by the factory. */
export interface CrudService<TApp> {
  /** Fetches all rows, mapped to app types. */
  list: () => Promise<TApp[]>;

  /** Fetches a single row by ID, or null if not found (PGRST116). */
  get: (id: string) => Promise<TApp | null>;

  /** Deletes a row by ID. */
  remove: (id: string) => Promise<void>;

  /** Subscribes to realtime changes. Returns a cleanup function. */
  subscribe: (callback: (items: TApp[]) => void) => () => void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a set of standard CRUD + subscribe operations for a Supabase table.
 *
 * Services import this factory, call it with their table-specific config, and
 * re-export the returned `list`, `get`, `remove`, `subscribe` under their
 * original exported names. Custom operations stay as explicit functions in
 * each service file.
 */
export function createCrudService<TApp>(config: CrudServiceConfig<TApp>): CrudService<TApp> {
  const {
    table,
    selectClause,
    mapRow,
    entityName,
    listLimit = 200,
    listOrder,
    subscription: subConfig,
  } = config;

  // -- list ----------------------------------------------------------------
  async function list(): Promise<TApp[]> {
    let query = (supabase.from as any)(table).select(selectClause);

    if (listOrder) {
      query = query.order(listOrder.column, { ascending: listOrder.ascending });
    }

    const { data, error } = await query.limit(listLimit);

    if (error) {
      throw new Error(`Failed to fetch ${entityName}s: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  // -- get -----------------------------------------------------------------
  async function get(id: string): Promise<TApp | null> {
    const { data, error } = await (supabase.from as any)(table)
      .select(selectClause)
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 = "no rows returned" from .single() -- treat as not found
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch ${entityName} ${id}: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  // -- remove --------------------------------------------------------------
  async function remove(id: string): Promise<void> {
    const { error } = await (supabase.from as any)(table).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ${entityName} ${id}: ${error.message}`);
    }
  }

  // -- subscribe -----------------------------------------------------------
  function rawSubscribe(callback: (items: TApp[]) => void): () => void {
    if (!subConfig) {
      // No subscription configured -- return a no-op cleanup
      return () => {};
    }

    // Debounced re-fetch to batch rapid Realtime events
    const debouncedRefetch = debounce(() => {
      list().then(callback).catch(console.error);
    }, 300);

    // Initial fetch (NOT debounced -- immediate)
    list().then(callback).catch(console.error);

    // Build channel with listeners for each configured table
    let channel = supabase.channel(subConfig.channelName);

    for (const entry of subConfig.tables) {
      const opts: Record<string, string> = {
        event: '*',
        schema: 'public',
        table: entry.table,
      };
      if (entry.filter) {
        opts.filter = entry.filter;
      }
      channel = channel.on('postgres_changes', opts as any, () => {
        debouncedRefetch();
      });
    }

    channel.subscribe();

    // Return cleanup
    return () => {
      debouncedRefetch.cancel();
      supabase.removeChannel(channel);
    };
  }

  // Wrap with shared subscription if configured
  let subscribe: (callback: (items: TApp[]) => void) => () => void;

  if (subConfig?.shared) {
    const shared = createSharedSubscription<TApp[]>(entityName + 's', rawSubscribe);
    subscribe = (callback) => shared.subscribe(callback);
  } else {
    subscribe = rawSubscribe;
  }

  return { list, get, remove, subscribe };
}
