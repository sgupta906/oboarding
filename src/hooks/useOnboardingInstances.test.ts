/**
 * useOnboardingInstances Hook Tests
 * Validates the hook reads from the Zustand store and preserves its API contract
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboardingStore, resetStoreInternals } from '../store';
import type { OnboardingInstance } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUnsubscribe = vi.fn();
const mockSubscribeToOnboardingInstances = vi.fn();

vi.mock('../services/supabase', () => ({
  subscribeToOnboardingInstances: (...args: unknown[]) =>
    mockSubscribeToOnboardingInstances(...args),
}));

import { useOnboardingInstances } from './useOnboardingInstances';

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

describe('useOnboardingInstances', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      instances: [],
      instancesLoading: false,
      instancesError: null,
    });
    resetStoreInternals();
    vi.clearAllMocks();

    mockSubscribeToOnboardingInstances.mockImplementation(() => mockUnsubscribe);
  });

  it('returns { data, isLoading, error } shape', () => {
    const { result } = renderHook(() => useOnboardingInstances(false));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('enabled=true starts subscription and populates data from store', () => {
    // Capture callback
    let capturedCallback: ((instances: OnboardingInstance[]) => void) | null = null;
    mockSubscribeToOnboardingInstances.mockImplementation(
      (cb: (instances: OnboardingInstance[]) => void) => {
        capturedCallback = cb;
        return mockUnsubscribe;
      }
    );

    const { result } = renderHook(() => useOnboardingInstances(true));

    // Subscription should have started
    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);

    // Simulate subscription data arriving
    const instances = [makeInstance('inst-1'), makeInstance('inst-2')];
    act(() => {
      capturedCallback!(instances);
    });

    expect(result.current.data).toEqual(instances);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('enabled=false returns empty data without starting subscription', () => {
    const { result } = renderHook(() => useOnboardingInstances(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSubscribeToOnboardingInstances).not.toHaveBeenCalled();
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() => useOnboardingInstances(true));

    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);

    unmount();

    // Last consumer -- unsubscribe should be called
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('switching enabled from true to false clears data', () => {
    // Capture callback
    let capturedCallback: ((instances: OnboardingInstance[]) => void) | null = null;
    mockSubscribeToOnboardingInstances.mockImplementation(
      (cb: (instances: OnboardingInstance[]) => void) => {
        capturedCallback = cb;
        return mockUnsubscribe;
      }
    );

    const { result, rerender } = renderHook(
      ({ enabled }) => useOnboardingInstances(enabled),
      { initialProps: { enabled: true } }
    );

    // Populate data
    act(() => {
      capturedCallback!([makeInstance('inst-1')]);
    });
    expect(result.current.data).toHaveLength(1);

    // Switch to disabled
    rerender({ enabled: false });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
