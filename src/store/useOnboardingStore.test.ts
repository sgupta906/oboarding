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

vi.mock('../services/supabase', () => ({
  subscribeToOnboardingInstances: (...args: unknown[]) =>
    mockSubscribeToOnboardingInstances(...args),
}));

import { useOnboardingStore, resetStoreInternals } from './useOnboardingStore';
import type { OnboardingInstance } from '../types';

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
    });
    resetStoreInternals();
    vi.clearAllMocks();

    // Default mock: returns an unsubscribe function
    mockSubscribeToOnboardingInstances.mockImplementation(() => {
      return mockUnsubscribe;
    });
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
});
