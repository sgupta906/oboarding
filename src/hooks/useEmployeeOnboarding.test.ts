/**
 * useEmployeeOnboarding Hook Tests
 * Validates the hook derives employee instance from the Zustand store
 * and preserves its API contract
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
  subscribeToEmployeeInstance: vi.fn(() => mockUnsubscribe),
}));

import { useEmployeeOnboarding } from './useEmployeeOnboarding';

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

describe('useEmployeeOnboarding', () => {
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

  it('returns { instance, isLoading, error } shape', () => {
    const { result } = renderHook(() => useEmployeeOnboarding(null));

    expect(result.current).toHaveProperty('instance');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });

  it('email=null returns null instance', () => {
    const { result } = renderHook(() => useEmployeeOnboarding(null));

    expect(result.current.instance).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('finds correct instance by email (case-insensitive)', () => {
    // Pre-populate the store with instances
    const instances = [
      makeInstance('inst-1', 'alice@example.com'),
      makeInstance('inst-2', 'bob@example.com'),
    ];
    useOnboardingStore.setState({ instances });

    const { result } = renderHook(() =>
      useEmployeeOnboarding('Alice@Example.COM')
    );

    expect(result.current.instance).not.toBeNull();
    expect(result.current.instance!.id).toBe('inst-1');
    expect(result.current.instance!.employeeEmail).toBe('alice@example.com');
  });

  it('returns most recent instance when multiple exist for same email', () => {
    const instances = [
      makeInstance('inst-old', 'alice@example.com', 1000),
      makeInstance('inst-new', 'alice@example.com', 2000),
    ];
    useOnboardingStore.setState({ instances });

    const { result } = renderHook(() =>
      useEmployeeOnboarding('alice@example.com')
    );

    expect(result.current.instance).not.toBeNull();
    expect(result.current.instance!.id).toBe('inst-new');
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() =>
      useEmployeeOnboarding('alice@example.com')
    );

    unmount();

    // Last consumer -- unsubscribe should be called
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('changing email re-evaluates the selector', () => {
    // Capture callback so we can populate data after subscription starts
    let capturedCallback: ((instances: OnboardingInstance[]) => void) | null = null;
    mockSubscribeToOnboardingInstances.mockImplementation(
      (cb: (instances: OnboardingInstance[]) => void) => {
        capturedCallback = cb;
        return mockUnsubscribe;
      }
    );

    const instances = [
      makeInstance('inst-1', 'alice@example.com'),
      makeInstance('inst-2', 'bob@example.com'),
    ];

    const { result, rerender } = renderHook(
      ({ email }) => useEmployeeOnboarding(email),
      { initialProps: { email: 'alice@example.com' as string | null } }
    );

    // Populate data via subscription callback
    act(() => {
      capturedCallback!(instances);
    });

    expect(result.current.instance!.id).toBe('inst-1');

    // Change email -- selector should re-evaluate from the same store data
    rerender({ email: 'bob@example.com' });

    // After rerender, the store data persists since the subscription is
    // ref-counted and re-started. Repopulate if needed.
    act(() => {
      capturedCallback!(instances);
    });

    expect(result.current.instance!.id).toBe('inst-2');
  });
});
