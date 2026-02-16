/**
 * Unit tests for crudFactory
 * Tests list, get, remove, and subscribe operations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createCrudService } from './crudFactory';

// ---------------------------------------------------------------------------
// Mock: supabase client
// ---------------------------------------------------------------------------

let currentQuery: any;

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => currentQuery),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock debounce to execute immediately for testing
vi.mock('../../utils/debounce', () => ({
  debounce: vi.fn((fn: any) => {
    const debounced = (...args: any[]) => fn(...args);
    debounced.cancel = vi.fn();
    return debounced;
  }),
}));

// Mock createSharedSubscription
vi.mock('./subscriptionManager', () => ({
  createSharedSubscription: vi.fn((_key: string, subscribeFn: any) => ({
    subscribe: (callback: any) => {
      return subscribeFn(callback);
    },
  })),
}));

// Get the mocked modules
import { supabase } from '../../config/supabase';
import { createSharedSubscription } from './subscriptionManager';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface TestItem {
  id: string;
  name: string;
}

const testMapper = (row: any): TestItem => ({
  id: row.id,
  name: row.name,
});

function createTestService(overrides: Partial<Parameters<typeof createCrudService<TestItem>>[0]> = {}) {
  return createCrudService<TestItem>({
    table: 'test_table',
    selectClause: '*',
    mapRow: testMapper,
    entityName: 'test item',
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createCrudService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // list()
  // ========================================================================

  describe('list()', () => {
    it('returns mapped results from Supabase query', async () => {
      const rows = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ];

      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
          }),
        }),
      };

      const service = createTestService();
      const result = await service.list();

      expect(result).toEqual([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ]);
    });

    it('applies correct selectClause', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      currentQuery = { select: mockSelectFn };

      const service = createTestService({ selectClause: '*, child_table(*)' });
      await service.list();

      expect(mockSelectFn).toHaveBeenCalledWith('*, child_table(*)');
    });

    it('applies default limit of 200', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue({ data: [], error: null });

      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: mockLimitFn,
        }),
      };

      const service = createTestService();
      await service.list();

      expect(mockLimitFn).toHaveBeenCalledWith(200);
    });

    it('applies custom limit when configured', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue({ data: [], error: null });

      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: mockLimitFn,
        }),
      };

      const service = createTestService({ listLimit: 50 });
      await service.list();

      expect(mockLimitFn).toHaveBeenCalledWith(50);
    });

    it('applies ordering when listOrder is configured', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrderFn = vi.fn().mockReturnValue({ limit: mockLimitFn });

      currentQuery = {
        select: vi.fn().mockReturnValue({
          order: mockOrderFn,
          limit: mockLimitFn,
        }),
      };

      const service = createTestService({
        listOrder: { column: 'timestamp', ascending: false },
      });
      await service.list();

      expect(mockOrderFn).toHaveBeenCalledWith('timestamp', { ascending: false });
    });

    it('throws with correct error message on Supabase error', async () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'connection failed' },
          }),
        }),
      };

      const service = createTestService();

      await expect(service.list()).rejects.toThrow('Failed to fetch test items: connection failed');
    });

    it('returns empty array when data is null', async () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      const service = createTestService();
      const result = await service.list();

      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // get()
  // ========================================================================

  describe('get()', () => {
    it('returns mapped result for existing ID', async () => {
      const row = { id: '1', name: 'Alice' };

      currentQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: row, error: null }),
          }),
        }),
      };

      const service = createTestService();
      const result = await service.get('1');

      expect(result).toEqual({ id: '1', name: 'Alice' });
    });

    it('returns null when PGRST116 error (not found)', async () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'not found' },
            }),
          }),
        }),
      };

      const service = createTestService();
      const result = await service.get('nonexistent');

      expect(result).toBeNull();
    });

    it('throws on other Supabase errors', async () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42P01', message: 'relation does not exist' },
            }),
          }),
        }),
      };

      const service = createTestService();

      await expect(service.get('1')).rejects.toThrow(
        'Failed to fetch test item 1: relation does not exist'
      );
    });

    it('returns null when data is null', async () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };

      const service = createTestService();
      const result = await service.get('1');

      expect(result).toBeNull();
    });
  });

  // ========================================================================
  // remove()
  // ========================================================================

  describe('remove()', () => {
    it('calls delete().eq on correct table with ID', async () => {
      const mockEqFn = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEqFn });

      currentQuery = { delete: mockDeleteFn };

      const service = createTestService();
      await service.remove('abc-123');

      expect(mockDeleteFn).toHaveBeenCalled();
      expect(mockEqFn).toHaveBeenCalledWith('id', 'abc-123');
    });

    it('throws with correct error message on Supabase error', async () => {
      const mockEqFn = vi.fn().mockResolvedValue({
        error: { message: 'foreign key violation' },
      });

      currentQuery = {
        delete: vi.fn().mockReturnValue({ eq: mockEqFn }),
      };

      const service = createTestService();

      await expect(service.remove('abc-123')).rejects.toThrow(
        'Failed to delete test item abc-123: foreign key violation'
      );
    });
  });

  // ========================================================================
  // subscribe()
  // ========================================================================

  describe('subscribe()', () => {
    it('returns no-op cleanup when no subscription configured', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const service = createTestService(); // No subscription config
      const callback = vi.fn();
      const cleanup = service.subscribe(callback);

      expect(typeof cleanup).toBe('function');
      // Should not throw
      cleanup();
    });

    it('performs initial fetch immediately', async () => {
      const rows = [{ id: '1', name: 'Alice' }];

      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      };

      // Need a channel mock
      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'test-all',
          tables: [{ table: 'test_table' }],
        },
      });

      const callback = vi.fn();
      service.subscribe(callback);

      // Wait for the promise to resolve
      await new Promise((r) => setTimeout(r, 10));

      expect(callback).toHaveBeenCalledWith([{ id: '1', name: 'Alice' }]);
    });

    it('sets up Supabase channel with correct channel name', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'my-channel',
          tables: [{ table: 'test_table' }],
        },
      });

      service.subscribe(vi.fn());

      expect(supabase.channel).toHaveBeenCalledWith('my-channel');
    });

    it('registers listeners for all configured tables', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'test-all',
          tables: [{ table: 'test_table' }, { table: 'test_child' }],
        },
      });

      service.subscribe(vi.fn());

      expect(channelObj.on).toHaveBeenCalledTimes(2);
    });

    it('returns cleanup function', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'test-all',
          tables: [{ table: 'test_table' }],
        },
      });

      const cleanup = service.subscribe(vi.fn());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes channel', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'test-all',
          tables: [{ table: 'test_table' }],
        },
      });

      const cleanup = service.subscribe(vi.fn());
      cleanup();

      expect(supabase.removeChannel).toHaveBeenCalledWith(channelObj);
    });

    it('handles multi-table listening (2+ tables)', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'test-all',
          tables: [
            { table: 'table_a' },
            { table: 'table_b' },
            { table: 'table_c' },
          ],
        },
      });

      service.subscribe(vi.fn());

      // Should have 3 .on() calls -- one per table
      expect(channelObj.on).toHaveBeenCalledTimes(3);
    });
  });

  // ========================================================================
  // subscribe() channel status callback
  // ========================================================================

  describe('subscribe() channel status callback', () => {
    it('should pass a status callback to channel.subscribe()', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'test-status',
          tables: [{ table: 'test_table' }],
        },
      });

      service.subscribe(vi.fn());

      // subscribe should have been called with a function argument (status callback)
      expect(channelObj.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('status callback logs error on CHANNEL_ERROR', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      const service = createTestService({
        subscription: {
          channelName: 'test-error-channel',
          tables: [{ table: 'test_table' }],
        },
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.subscribe(vi.fn());

      // Extract the status callback from channel.subscribe call
      const statusCallback = channelObj.subscribe.mock.calls[0][0];
      expect(typeof statusCallback).toBe('function');

      // Call it with CHANNEL_ERROR
      statusCallback('CHANNEL_ERROR');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-error-channel')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ========================================================================
  // shared subscription
  // ========================================================================

  describe('shared subscription', () => {
    it('wraps with createSharedSubscription when shared: true', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      createTestService({
        subscription: {
          channelName: 'test-all',
          tables: [{ table: 'test_table' }],
          shared: true,
        },
      });

      // createSharedSubscription should have been called
      expect(createSharedSubscription).toHaveBeenCalledWith(
        'test items',
        expect.any(Function)
      );
    });

    it('does NOT wrap when shared is false or omitted', () => {
      currentQuery = {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const channelObj = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      (supabase.channel as any) = vi.fn().mockReturnValue(channelObj);

      // Clear mock call count
      (createSharedSubscription as any).mockClear();

      createTestService({
        subscription: {
          channelName: 'test-all',
          tables: [{ table: 'test_table' }],
          // shared not set
        },
      });

      expect(createSharedSubscription).not.toHaveBeenCalled();
    });
  });
});
