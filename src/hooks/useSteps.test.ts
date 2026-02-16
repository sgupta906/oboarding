/**
 * useSteps Hook Tests - Verify optimistic updateStatus behavior
 * Tests: optimistic update applies immediately, rollback on error, return shape
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the services
const mockSubscribeToSteps = vi.fn();
const mockUpdateStepStatus = vi.fn();

vi.mock('../services/supabase', () => ({
  subscribeToSteps: (...args: any[]) => mockSubscribeToSteps(...args),
  updateStepStatus: (...args: any[]) => mockUpdateStepStatus(...args),
  subscribeToOnboardingInstances: vi.fn(() => () => {}),
}));

import { useSteps } from './useSteps';
import { resetStoreInternals, useOnboardingStore } from '../store';
import type { Step } from '../types';

const makeStep = (id: number, status: 'pending' | 'completed' | 'stuck' = 'pending'): Step => ({
  id,
  title: `Step ${id}`,
  description: `Description for step ${id}`,
  role: 'All',
  owner: 'IT',
  expert: 'Expert',
  status,
  link: '',
});

describe('useSteps', () => {
  beforeEach(() => {
    // Reset store state and ref-counting before clearing mocks
    useOnboardingStore.setState({
      stepsByInstance: {},
      stepsLoadingByInstance: {},
      stepsErrorByInstance: {},
    });
    resetStoreInternals();
    vi.clearAllMocks();

    mockSubscribeToSteps.mockImplementation((_id: string, cb: (steps: Step[]) => void) => {
      // Simulate initial data
      cb([makeStep(1), makeStep(2), makeStep(3)]);
      return () => {};
    });

    mockUpdateStepStatus.mockResolvedValue(undefined);
  });

  it('returns data, isLoading, error, and updateStatus', () => {
    const { result } = renderHook(() => useSteps('inst-1'));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('updateStatus');
    expect(typeof result.current.updateStatus).toBe('function');
  });

  it('updateStatus applies optimistic change to data immediately', async () => {
    const { result } = renderHook(() => useSteps('inst-1'));

    // Initial state: all pending
    expect(result.current.data[0].status).toBe('pending');

    // Optimistic update (don't await)
    let updatePromise: Promise<void>;
    act(() => {
      updatePromise = result.current.updateStatus(1, 'completed');
    });

    // Data should immediately reflect the change
    expect(result.current.data[0].status).toBe('completed');
    expect(result.current.data[1].status).toBe('pending'); // Others unchanged

    await act(async () => {
      await updatePromise!;
    });
  });

  it('updateStatus rolls back on server error', async () => {
    mockUpdateStepStatus.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useSteps('inst-1'));

    expect(result.current.data[0].status).toBe('pending');

    await act(async () => {
      try {
        await result.current.updateStatus(1, 'completed');
      } catch {
        // Expected
      }
    });

    // Should have rolled back to original status
    expect(result.current.data[0].status).toBe('pending');
  });
});
