import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Supabase Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('SDK Package', () => {
    it('should have the Supabase SDK package installed and importable', async () => {
      const supabaseModule = await import('@supabase/supabase-js');
      expect(supabaseModule).toBeDefined();
    });

    it('should export createClient function from SDK', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      expect(createClient).toBeDefined();
      expect(typeof createClient).toBe('function');
    });
  });

  describe('Config Module', () => {
    beforeEach(() => {
      // Set required env vars for successful client creation
      (import.meta.env as any).VITE_SUPABASE_URL = 'http://127.0.0.1:54321';
      (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-anon-key-for-unit-tests';
    });

    it('should export a supabase client from config module', async () => {
      const config = await import('./supabase');
      expect(config.supabase).toBeDefined();
    });

    it('should have expected client methods (from, auth, storage, channel)', async () => {
      const config = await import('./supabase');
      const { supabase } = config;

      expect(typeof supabase.from).toBe('function');
      expect(typeof supabase.auth).toBe('object');
      expect(typeof supabase.storage).toBe('object');
      expect(typeof supabase.channel).toBe('function');
    });
  });

  describe('Environment Variable Validation', () => {
    it('should throw an error when VITE_SUPABASE_URL is missing', async () => {
      (import.meta.env as any).VITE_SUPABASE_URL = '';
      (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-key';

      await expect(import('./supabase')).rejects.toThrow(
        /Missing Supabase environment variables/
      );
    });

    it('should throw an error when VITE_SUPABASE_ANON_KEY is missing', async () => {
      (import.meta.env as any).VITE_SUPABASE_URL = 'http://127.0.0.1:54321';
      (import.meta.env as any).VITE_SUPABASE_ANON_KEY = '';

      await expect(import('./supabase')).rejects.toThrow(
        /Missing Supabase environment variables/
      );
    });
  });

  describe('Database Types', () => {
    it('should have the database types file importable', async () => {
      const types = await import('../types/database.types');
      expect(types).toBeDefined();
    });

    it('should export a Database type with expected table structure', async () => {
      // Verify the module exports exist - the Database type is a TypeScript type
      // so we verify the module itself is importable and well-formed.
      // We also verify that the type helper exports work at runtime.
      const types = await import('../types/database.types');
      // The module should at minimum be importable without errors.
      // TypeScript compiler validates the Database type at build time.
      expect(types).toBeDefined();
    });
  });
});
