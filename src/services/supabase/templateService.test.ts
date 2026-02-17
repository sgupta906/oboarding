/**
 * templateService Tests - Verify syncTemplateStepsToInstances behavior
 *
 * Tests exercise the sync function indirectly through updateTemplate(),
 * since syncTemplateStepsToInstances is a private (non-exported) function.
 *
 * The core algorithm under test: title-based reconciliation that preserves
 * instance step statuses while updating positions, descriptions, and metadata
 * from template steps.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Step } from '../../types';

// ---------------------------------------------------------------------------
// Mock: instanceService (capture updateOnboardingInstance calls)
// ---------------------------------------------------------------------------

const mockUpdateOnboardingInstance = vi.fn().mockResolvedValue(undefined);

vi.mock('./instanceService', () => ({
  updateOnboardingInstance: (...args: any[]) => mockUpdateOnboardingInstance(...args),
}));

// ---------------------------------------------------------------------------
// Mock: supabase client
// ---------------------------------------------------------------------------

/** Configurable result for onboarding_instances select query */
let instancesQueryResult: { data: any[] | null; error: any };

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'templates') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        };
      }
      if (table === 'template_steps') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
          insert: vi.fn(() => ({ error: null })),
        };
      }
      if (table === 'onboarding_instances') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => instancesQueryResult),
          })),
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

// ---------------------------------------------------------------------------
// Mock: crudFactory (stub factory-generated operations)
// ---------------------------------------------------------------------------

vi.mock('./crudFactory', () => ({
  createCrudService: vi.fn(() => ({
    list: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    subscribe: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock: subscriptionManager
// ---------------------------------------------------------------------------

vi.mock('./subscriptionManager', () => ({
  createSharedSubscription: vi.fn((_key: string, subscribeFn: any) => ({
    subscribe: (callback: any) => subscribeFn(callback),
  })),
}));

// ---------------------------------------------------------------------------
// Import the function under test (after mocks are set up)
// ---------------------------------------------------------------------------

import { updateTemplate } from './templateService';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/** Creates a Step with sensible defaults, overridable via partial. */
function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: 1,
    title: 'Default Step',
    description: 'Default description',
    role: 'All',
    owner: 'IT Support',
    expert: 'Jane Doe',
    status: 'pending',
    link: '',
    ...overrides,
  };
}

/**
 * Creates a mock instance DB row (as returned by Supabase select with joined steps).
 * The instance_steps array uses DB column names (position, title, etc.).
 */
function makeInstanceRow(
  id: string,
  templateId: string,
  steps: Step[]
): Record<string, any> {
  return {
    id,
    employee_name: 'Test Employee',
    employee_email: 'test@example.com',
    role: 'Engineer',
    department: 'Engineering',
    template_id: templateId,
    progress: 0,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    start_date: null,
    completed_at: null,
    template_snapshots: null,
    instance_steps: steps.map((s) => ({
      id: `step-uuid-${s.id}`,
      instance_id: id,
      position: s.id,
      title: s.title,
      description: s.description,
      role: s.role,
      owner: s.owner,
      expert: s.expert,
      status: s.status,
      link: s.link || null,
    })),
  };
}

/**
 * Helper to call updateTemplate with steps (triggers sync).
 * The template ID is fixed to 'tmpl-1' for all tests.
 */
async function triggerSync(templateSteps: Step[]): Promise<void> {
  await updateTemplate('tmpl-1', { steps: templateSteps });
}

/**
 * Extracts the steps and progress from the updateOnboardingInstance call
 * for the given instance (by call index, default 0 = first instance).
 */
function getSyncedUpdate(callIndex = 0): { steps: Step[]; progress: number } {
  const call = mockUpdateOnboardingInstance.mock.calls[callIndex];
  expect(call).toBeDefined();
  return {
    steps: call[1].steps,
    progress: call[1].progress,
  };
}

// ===========================================================================
// Tests
// ===========================================================================

describe('syncTemplateStepsToInstances (via updateTemplate)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instancesQueryResult = { data: [], error: null };
  });

  // -------------------------------------------------------------------------
  // Reorder Tests (Task 2.2)
  // -------------------------------------------------------------------------

  describe('Reorder', () => {
    it('preserves completion status when steps are reordered', async () => {
      // Instance has steps A(completed), B(pending), C(stuck), D(completed)
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'pending' }),
        makeStep({ id: 3, title: 'Step C', status: 'stuck' }),
        makeStep({ id: 4, title: 'Step D', status: 'completed' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Template reorders to B, A, D, C
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Step B', status: 'pending' }),
        makeStep({ id: 2, title: 'Step A', status: 'pending' }),
        makeStep({ id: 3, title: 'Step D', status: 'pending' }),
        makeStep({ id: 4, title: 'Step C', status: 'pending' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();

      // Positions should follow new template order
      expect(steps).toHaveLength(4);
      expect(steps[0]).toMatchObject({ id: 1, title: 'Step B', status: 'pending' });
      expect(steps[1]).toMatchObject({ id: 2, title: 'Step A', status: 'completed' });
      expect(steps[2]).toMatchObject({ id: 3, title: 'Step D', status: 'completed' });
      expect(steps[3]).toMatchObject({ id: 4, title: 'Step C', status: 'stuck' });

      // 2 of 4 completed = 50%
      expect(progress).toBe(50);
    });

    it('preserves 100% progress when all-completed steps are reordered', async () => {
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'completed' }),
        makeStep({ id: 3, title: 'Step C', status: 'completed' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Reorder to C, A, B
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Step C', status: 'pending' }),
        makeStep({ id: 2, title: 'Step A', status: 'pending' }),
        makeStep({ id: 3, title: 'Step B', status: 'pending' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(3);
      expect(steps.every((s) => s.status === 'completed')).toBe(true);
      expect(progress).toBe(100);
    });

    it('handles single step template sync correctly', async () => {
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Only Step', status: 'completed', description: 'Old desc' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Only Step', status: 'pending', description: 'New desc' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(1);
      expect(steps[0]).toMatchObject({
        id: 1,
        title: 'Only Step',
        status: 'completed',
        description: 'New desc',
      });
      expect(progress).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // Field Update Tests (Task 2.3)
  // -------------------------------------------------------------------------

  describe('Field Updates', () => {
    it('propagates description change while preserving status', async () => {
      const instanceSteps: Step[] = [
        makeStep({
          id: 1,
          title: 'Setup laptop',
          description: 'Old description',
          status: 'completed',
        }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      const templateSteps: Step[] = [
        makeStep({
          id: 1,
          title: 'Setup laptop',
          description: 'Updated description with new details',
          status: 'pending',
        }),
      ];

      await triggerSync(templateSteps);

      const { steps } = getSyncedUpdate();
      expect(steps[0].description).toBe('Updated description with new details');
      expect(steps[0].status).toBe('completed');
    });

    it('propagates owner/expert/role/link changes while preserving status', async () => {
      const instanceSteps: Step[] = [
        makeStep({
          id: 1,
          title: 'Security training',
          status: 'stuck',
          owner: 'Old Owner',
          expert: 'Old Expert',
          role: 'Old Role',
          link: 'https://old-link.com',
        }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      const templateSteps: Step[] = [
        makeStep({
          id: 1,
          title: 'Security training',
          status: 'pending',
          owner: 'New Owner',
          expert: 'New Expert',
          role: 'New Role',
          link: 'https://new-link.com',
        }),
      ];

      await triggerSync(templateSteps);

      const { steps } = getSyncedUpdate();
      expect(steps[0]).toMatchObject({
        title: 'Security training',
        status: 'stuck',
        owner: 'New Owner',
        expert: 'New Expert',
        role: 'New Role',
        link: 'https://new-link.com',
      });
    });
  });

  // -------------------------------------------------------------------------
  // Add/Remove Tests (Task 2.4)
  // -------------------------------------------------------------------------

  describe('Add/Remove', () => {
    it('adds new template step to instance as pending', async () => {
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Existing Step', status: 'completed' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Template now has existing step + a new one
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Existing Step', status: 'pending' }),
        makeStep({ id: 2, title: 'Security training', status: 'pending', description: 'New step' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(2);
      expect(steps[0]).toMatchObject({ id: 1, title: 'Existing Step', status: 'completed' });
      expect(steps[1]).toMatchObject({ id: 2, title: 'Security training', status: 'pending' });
      // 1 of 2 completed = 50%
      expect(progress).toBe(50);
    });

    it('drops step removed from template', async () => {
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'pending' }),
        makeStep({ id: 3, title: 'Step C', status: 'completed' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Template removes Step B
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'pending' }),
        makeStep({ id: 2, title: 'Step C', status: 'pending' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(2);
      expect(steps[0]).toMatchObject({ id: 1, title: 'Step A', status: 'completed' });
      expect(steps[1]).toMatchObject({ id: 2, title: 'Step C', status: 'completed' });
      // 2 of 2 completed = 100%
      expect(progress).toBe(100);
    });

    it('handles mixed add + remove + reorder correctly', async () => {
      // Instance: A(completed), B(pending), C(stuck), D(completed)
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'pending' }),
        makeStep({ id: 3, title: 'Step C', status: 'stuck' }),
        makeStep({ id: 4, title: 'Step D', status: 'completed' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Template: remove B, add New Step, reorder to D, A, New Step, C
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Step D', status: 'pending' }),
        makeStep({ id: 2, title: 'Step A', status: 'pending' }),
        makeStep({ id: 3, title: 'New Step', status: 'pending' }),
        makeStep({ id: 4, title: 'Step C', status: 'pending' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(4);
      expect(steps[0]).toMatchObject({ id: 1, title: 'Step D', status: 'completed' });
      expect(steps[1]).toMatchObject({ id: 2, title: 'Step A', status: 'completed' });
      expect(steps[2]).toMatchObject({ id: 3, title: 'New Step', status: 'pending' });
      expect(steps[3]).toMatchObject({ id: 4, title: 'Step C', status: 'stuck' });
      // 2 of 4 completed = 50%
      expect(progress).toBe(50);
    });
  });

  // -------------------------------------------------------------------------
  // Progress Calculation Tests (Task 2.5)
  // -------------------------------------------------------------------------

  describe('Progress Calculation', () => {
    it('increases progress when pending steps are removed', async () => {
      // 2/4 completed
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'pending' }),
        makeStep({ id: 3, title: 'Step C', status: 'completed' }),
        makeStep({ id: 4, title: 'Step D', status: 'pending' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Remove 2 pending steps, keep 2 completed
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'pending' }),
        makeStep({ id: 2, title: 'Step C', status: 'pending' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(2);
      // 2/2 completed = 100%
      expect(progress).toBe(100);
    });

    it('decreases progress when new step is added', async () => {
      // 3/3 completed = 100%
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'completed' }),
        makeStep({ id: 3, title: 'Step C', status: 'completed' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Add 1 new pending step
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'pending' }),
        makeStep({ id: 2, title: 'Step B', status: 'pending' }),
        makeStep({ id: 3, title: 'Step C', status: 'pending' }),
        makeStep({ id: 4, title: 'New Step', status: 'pending' }),
      ];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(4);
      // 3/4 completed = 75%
      expect(progress).toBe(75);
    });
  });

  // -------------------------------------------------------------------------
  // Edge Case Tests (Task 2.6)
  // -------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('clears all instance steps when template has empty steps', async () => {
      const instanceSteps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'pending' }),
      ];
      instancesQueryResult = {
        data: [makeInstanceRow('inst-1', 'tmpl-1', instanceSteps)],
        error: null,
      };

      // Template has no steps
      const templateSteps: Step[] = [];

      await triggerSync(templateSteps);

      const { steps, progress } = getSyncedUpdate();
      expect(steps).toHaveLength(0);
      expect(progress).toBe(0);
    });

    it('syncs multiple instances independently', async () => {
      // Instance 1: Step A completed, Step B pending
      const inst1Steps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'completed' }),
        makeStep({ id: 2, title: 'Step B', status: 'pending' }),
      ];

      // Instance 2: Step A pending, Step B completed
      const inst2Steps: Step[] = [
        makeStep({ id: 1, title: 'Step A', status: 'pending' }),
        makeStep({ id: 2, title: 'Step B', status: 'completed' }),
      ];

      instancesQueryResult = {
        data: [
          makeInstanceRow('inst-1', 'tmpl-1', inst1Steps),
          makeInstanceRow('inst-2', 'tmpl-1', inst2Steps),
        ],
        error: null,
      };

      // Template reorders to B, A
      const templateSteps: Step[] = [
        makeStep({ id: 1, title: 'Step B', status: 'pending' }),
        makeStep({ id: 2, title: 'Step A', status: 'pending' }),
      ];

      await triggerSync(templateSteps);

      expect(mockUpdateOnboardingInstance).toHaveBeenCalledTimes(2);

      // Instance 1: B(pending), A(completed) -> 1/2 = 50%
      const update1 = getSyncedUpdate(0);
      expect(update1.steps[0]).toMatchObject({ id: 1, title: 'Step B', status: 'pending' });
      expect(update1.steps[1]).toMatchObject({ id: 2, title: 'Step A', status: 'completed' });
      expect(update1.progress).toBe(50);

      // Instance 2: B(completed), A(pending) -> 1/2 = 50%
      const update2 = getSyncedUpdate(1);
      expect(update2.steps[0]).toMatchObject({ id: 1, title: 'Step B', status: 'completed' });
      expect(update2.steps[1]).toMatchObject({ id: 2, title: 'Step A', status: 'pending' });
      expect(update2.progress).toBe(50);
    });
  });
});
