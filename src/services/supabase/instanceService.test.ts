/**
 * instanceService Tests - Verify updateStepStatus status revert logic
 * Tests that instance status correctly transitions between 'active' and 'completed'
 * based on step progress calculations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock: supabase client
// ---------------------------------------------------------------------------

let updateStepResult: any;
let fetchStepsResult: any;
let updateInstanceResult: any;

const mockUpdate = vi.fn();

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'instance_steps') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => updateStepResult),
              })),
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => fetchStepsResult),
          })),
        };
      }
      if (table === 'onboarding_instances') {
        return {
          update: vi.fn((data: any) => {
            mockUpdate(data);
            return {
              eq: vi.fn(() => updateInstanceResult),
            };
          }),
        };
      }
      return {};
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../utils/debounce', () => ({
  debounce: vi.fn((fn: any) => {
    const debounced = (...args: any[]) => fn(...args);
    debounced.cancel = vi.fn();
    return debounced;
  }),
}));

vi.mock('./subscriptionManager', () => ({
  createSharedSubscription: vi.fn((_key: string, subscribeFn: any) => ({
    subscribe: (callback: any) => {
      return subscribeFn(callback);
    },
  })),
}));

import { updateStepStatus } from './instanceService';

describe('updateStepStatus - status revert logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateInstanceResult = { error: null };
  });

  it('sets status to completed and completed_at when progress reaches 100%', async () => {
    // All steps completed
    updateStepResult = { data: [{ position: 1 }], error: null };
    fetchStepsResult = {
      data: [
        { status: 'completed' },
        { status: 'completed' },
      ],
      error: null,
    };

    await updateStepStatus('inst-1', 1, 'completed');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 100,
        status: 'completed',
        completed_at: expect.any(String),
      })
    );
  });

  it('sets status to active and completed_at to null when progress drops below 100%', async () => {
    // One of two steps completed (50%)
    updateStepResult = { data: [{ position: 1 }], error: null };
    fetchStepsResult = {
      data: [
        { status: 'completed' },
        { status: 'pending' },
      ],
      error: null,
    };

    await updateStepStatus('inst-1', 1, 'pending');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 50,
        status: 'active',
        completed_at: null,
      })
    );
  });

  it('sets status to active and progress to 0 when no steps are completed', async () => {
    // Zero of two steps completed (0%)
    updateStepResult = { data: [{ position: 1 }], error: null };
    fetchStepsResult = {
      data: [
        { status: 'pending' },
        { status: 'pending' },
      ],
      error: null,
    };

    await updateStepStatus('inst-1', 1, 'pending');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 0,
        status: 'active',
        completed_at: null,
      })
    );
  });
});
