/**
 * useOnboardingStore Unit Tests
 * Tests for Zustand store: state management, subscription lifecycle, ref-counting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUnsubscribe = vi.fn();
const mockSubscribeToOnboardingInstances = vi.fn();
const mockStepsUnsubscribe = vi.fn();
const mockSubscribeToSteps = vi.fn();
const mockUpdateStepStatus = vi.fn();

vi.mock('../services/supabase', () => ({
  subscribeToOnboardingInstances: (...args: unknown[]) =>
    mockSubscribeToOnboardingInstances(...args),
  subscribeToSteps: (...args: unknown[]) => mockSubscribeToSteps(...args),
  updateStepStatus: (...args: unknown[]) => mockUpdateStepStatus(...args),
}));

import { useOnboardingStore, resetStoreInternals } from './useOnboardingStore';
import type { OnboardingInstance, Step } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeInstance = (
  id: string,
  email = 'test@example.com',
  createdAt = Date.now()
): OnboardingInstance => ({
  id,
  employeeName: 'Test User',
  employeeEmail: email,
  role: 'Engineering',
  department: 'Tech',
  templateId: 'tmpl-1',
  steps: [],
  createdAt,
  progress: 0,
  status: 'active',
});

const makeStep = (
  id: number,
  status: 'pending' | 'completed' | 'stuck' = 'pending'
): Step => ({
  id,
  title: `Step ${id}`,
  description: `Description for step ${id}`,
  role: 'All',
  owner: 'IT',
  expert: 'Expert',
  status,
  link: '',
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOnboardingStore', () => {
  beforeEach(() => {
    // Reset store state and module-level ref-counting between tests
    // Must happen BEFORE clearing mocks, since resetStoreInternals may
    // call the unsubscribe function from a prior test run.
    useOnboardingStore.setState({
      instances: [],
      instancesLoading: false,
      instancesError: null,
      stepsByInstance: {},
      stepsLoadingByInstance: {},
      stepsErrorByInstance: {},
    });
    resetStoreInternals();
    vi.clearAllMocks();

    // Default mock: returns an unsubscribe function
    mockSubscribeToOnboardingInstances.mockImplementation(() => {
      return mockUnsubscribe;
    });

    // Default steps mock: returns an unsubscribe function
    mockSubscribeToSteps.mockImplementation(() => {
      return mockStepsUnsubscribe;
    });

    mockUpdateStepStatus.mockResolvedValue(undefined);
  });

  it('initializes with empty state', () => {
    const state = useOnboardingStore.getState();

    expect(state.instances).toEqual([]);
    expect(state.instancesLoading).toBe(false);
    expect(state.instancesError).toBeNull();
    expect(typeof state._startInstancesSubscription).toBe('function');
  });

  it('_startInstancesSubscription calls subscribeToOnboardingInstances', () => {
    const cleanup = useOnboardingStore.getState()._startInstancesSubscription();

    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);
    expect(typeof cleanup).toBe('function');

    // Store should be in loading state
    expect(useOnboardingStore.getState().instancesLoading).toBe(true);
  });

  it('subscription callback updates instances and clears loading', () => {
    // Capture the callback passed to subscribeToOnboardingInstances
    let capturedCallback: ((instances: OnboardingInstance[]) => void) | null = null;
    mockSubscribeToOnboardingInstances.mockImplementation(
      (cb: (instances: OnboardingInstance[]) => void) => {
        capturedCallback = cb;
        return mockUnsubscribe;
      }
    );

    useOnboardingStore.getState()._startInstancesSubscription();

    expect(capturedCallback).not.toBeNull();

    // Simulate subscription firing with data
    const instances = [makeInstance('inst-1'), makeInstance('inst-2')];
    capturedCallback!(instances);

    const state = useOnboardingStore.getState();
    expect(state.instances).toEqual(instances);
    expect(state.instancesLoading).toBe(false);
  });

  it('subscription error sets error and clears loading', () => {
    const testError = new Error('Subscription failed');
    mockSubscribeToOnboardingInstances.mockImplementation(() => {
      throw testError;
    });

    useOnboardingStore.getState()._startInstancesSubscription();

    const state = useOnboardingStore.getState();
    expect(state.instancesError).toEqual(testError);
    expect(state.instancesLoading).toBe(false);
    expect(state.instances).toEqual([]);
  });

  it('second _startInstancesSubscription does not create duplicate subscription', () => {
    const cleanup1 = useOnboardingStore.getState()._startInstancesSubscription();
    const cleanup2 = useOnboardingStore.getState()._startInstancesSubscription();

    // subscribeToOnboardingInstances should only be called once
    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);

    // Both should return valid cleanup functions
    expect(typeof cleanup1).toBe('function');
    expect(typeof cleanup2).toBe('function');
  });

  it('cleanup decrements ref count', () => {
    // Start two consumers
    const cleanup1 = useOnboardingStore.getState()._startInstancesSubscription();
    const cleanup2 = useOnboardingStore.getState()._startInstancesSubscription();

    // First consumer cleans up
    cleanup1();

    // Unsubscribe should NOT have been called (still 1 consumer)
    expect(mockUnsubscribe).not.toHaveBeenCalled();

    // Clean up second consumer
    cleanup2();

    // NOW unsubscribe should be called (last consumer)
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('last cleanup unsubscribes and resets state', () => {
    // Capture the callback to populate data
    let capturedCallback: ((instances: OnboardingInstance[]) => void) | null = null;
    mockSubscribeToOnboardingInstances.mockImplementation(
      (cb: (instances: OnboardingInstance[]) => void) => {
        capturedCallback = cb;
        return mockUnsubscribe;
      }
    );

    const cleanup = useOnboardingStore.getState()._startInstancesSubscription();

    // Populate data
    capturedCallback!([makeInstance('inst-1')]);
    expect(useOnboardingStore.getState().instances).toHaveLength(1);

    // Clean up last consumer
    cleanup();

    // Unsubscribe should be called
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

    // State should be reset
    const state = useOnboardingStore.getState();
    expect(state.instances).toEqual([]);
    expect(state.instancesLoading).toBe(false);
    expect(state.instancesError).toBeNull();
  });

  it('double cleanup is safe (idempotent)', () => {
    const cleanup = useOnboardingStore.getState()._startInstancesSubscription();

    cleanup();
    cleanup(); // Should not throw or double-decrement

    // Unsubscribe called exactly once
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('re-subscribe after full cleanup works', () => {
    // First subscription cycle
    const cleanup1 = useOnboardingStore.getState()._startInstancesSubscription();
    cleanup1();

    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

    // Second subscription cycle
    const cleanup2 = useOnboardingStore.getState()._startInstancesSubscription();

    // Should start a new subscription
    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(2);
    expect(useOnboardingStore.getState().instancesLoading).toBe(true);

    cleanup2();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // StepsSlice
  // -------------------------------------------------------------------------

  describe('StepsSlice', () => {
    it('initializes with empty steps state', () => {
      const state = useOnboardingStore.getState();

      expect(state.stepsByInstance).toEqual({});
      expect(state.stepsLoadingByInstance).toEqual({});
      expect(state.stepsErrorByInstance).toEqual({});
      expect(typeof state._startStepsSubscription).toBe('function');
      expect(typeof state._updateStepStatus).toBe('function');
    });

    it('_startStepsSubscription calls subscribeToSteps with instanceId', () => {
      const cleanup = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);
      expect(mockSubscribeToSteps).toHaveBeenCalledWith(
        'inst-1',
        expect.any(Function)
      );
      expect(typeof cleanup).toBe('function');
    });

    it('_startStepsSubscription sets loading state for instanceId', () => {
      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      const state = useOnboardingStore.getState();
      expect(state.stepsLoadingByInstance['inst-1']).toBe(true);
    });

    it('subscription callback updates stepsByInstance and clears loading', () => {
      // Capture the callback passed to subscribeToSteps
      let capturedCallback: ((steps: Step[]) => void) | null = null;
      mockSubscribeToSteps.mockImplementation(
        (_id: string, cb: (steps: Step[]) => void) => {
          capturedCallback = cb;
          return mockStepsUnsubscribe;
        }
      );

      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      expect(capturedCallback).not.toBeNull();

      // Simulate subscription firing with data
      const steps = [makeStep(1), makeStep(2)];
      capturedCallback!(steps);

      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1']).toEqual(steps);
      expect(state.stepsLoadingByInstance['inst-1']).toBe(false);
    });

    it('subscription error sets error and clears loading', () => {
      const testError = new Error('Steps subscription failed');
      mockSubscribeToSteps.mockImplementation(() => {
        throw testError;
      });

      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      const state = useOnboardingStore.getState();
      expect(state.stepsErrorByInstance['inst-1']).toEqual(testError);
      expect(state.stepsLoadingByInstance['inst-1']).toBe(false);
    });

    it('second start for same instanceId is no-op (subscribeToSteps called once)', () => {
      const cleanup1 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');
      const cleanup2 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);
      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');
    });

    it('different instanceIds get separate subscriptions', () => {
      useOnboardingStore.getState()._startStepsSubscription('inst-1');
      useOnboardingStore.getState()._startStepsSubscription('inst-2');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(2);
      expect(mockSubscribeToSteps).toHaveBeenCalledWith(
        'inst-1',
        expect.any(Function)
      );
      expect(mockSubscribeToSteps).toHaveBeenCalledWith(
        'inst-2',
        expect.any(Function)
      );
    });

    it('cleanup decrements ref count (2 consumers, first cleanup does not unsubscribe)', () => {
      const cleanup1 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');
      const cleanup2 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      // First consumer cleans up
      cleanup1();

      // Unsubscribe should NOT have been called (still 1 consumer)
      expect(mockStepsUnsubscribe).not.toHaveBeenCalled();

      // Clean up second consumer
      cleanup2();

      // NOW unsubscribe should be called
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('last cleanup unsubscribes and clears that instanceId state', () => {
      // Capture the callback to populate data
      let capturedCallback: ((steps: Step[]) => void) | null = null;
      mockSubscribeToSteps.mockImplementation(
        (_id: string, cb: (steps: Step[]) => void) => {
          capturedCallback = cb;
          return mockStepsUnsubscribe;
        }
      );

      const cleanup = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      // Populate data
      capturedCallback!([makeStep(1), makeStep(2)]);
      expect(useOnboardingStore.getState().stepsByInstance['inst-1']).toHaveLength(2);

      // Clean up last consumer
      cleanup();

      // Unsubscribe should be called
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);

      // That instanceId's state should be cleared
      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1']).toBeUndefined();
      expect(state.stepsLoadingByInstance['inst-1']).toBeUndefined();
      expect(state.stepsErrorByInstance['inst-1']).toBeUndefined();
    });

    it('double cleanup is safe (idempotent)', () => {
      const cleanup = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      cleanup();
      cleanup(); // Should not throw or double-decrement

      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('re-subscribe after full cleanup works', () => {
      // First subscription cycle
      const cleanup1 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');
      cleanup1();

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);

      // Second subscription cycle
      const cleanup2 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      // Should start a new subscription
      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(2);
      expect(
        useOnboardingStore.getState().stepsLoadingByInstance['inst-1']
      ).toBe(true);

      cleanup2();
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(2);
    });

    it('_updateStepStatus applies optimistic update immediately', async () => {
      // Pre-populate store with steps
      useOnboardingStore.setState({
        stepsByInstance: {
          'inst-1': [makeStep(1, 'pending'), makeStep(2, 'pending')],
        },
      });

      // Start update (don't await yet)
      const promise = useOnboardingStore
        .getState()
        ._updateStepStatus('inst-1', 1, 'completed');

      // Optimistic update should be applied synchronously
      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1'][0].status).toBe('completed');
      expect(state.stepsByInstance['inst-1'][1].status).toBe('pending');

      await promise;
    });

    it('_updateStepStatus rolls back on server error and re-throws', async () => {
      const serverError = new Error('Server error');
      mockUpdateStepStatus.mockRejectedValue(serverError);

      // Pre-populate store with steps
      useOnboardingStore.setState({
        stepsByInstance: {
          'inst-1': [makeStep(1, 'pending'), makeStep(2, 'pending')],
        },
      });

      await expect(
        useOnboardingStore
          .getState()
          ._updateStepStatus('inst-1', 1, 'completed')
      ).rejects.toThrow('Server error');

      // Should have rolled back
      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1'][0].status).toBe('pending');
      expect(state.stepsByInstance['inst-1'][1].status).toBe('pending');
    });

    it('resetStoreInternals clears steps ref-counting', () => {
      // Start a steps subscription
      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);

      // Reset
      resetStoreInternals();

      // Starting again should create a new subscription (not be a no-op)
      useOnboardingStore.getState()._startStepsSubscription('inst-1');
      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(2);
    });
  });
});
