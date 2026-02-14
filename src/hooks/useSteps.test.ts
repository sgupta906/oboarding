/**
 * Unit tests for useSteps hook
 * Tests subscription lifecycle, loading states, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSteps } from './useSteps';
import { subscribeToSteps } from '../services/supabase';
import type { Step } from '../types';

// Mock supabase service
vi.mock('../services/supabase', () => ({
  subscribeToSteps: vi.fn(),
}));

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockSteps: Step[] = [
  {
    id: 1,
    title: 'Setup Development Environment',
    description: 'Install and configure dev tools',
    role: 'Engineering',
    owner: 'DevOps',
    expert: 'John Doe',
    status: 'pending',
    link: 'https://example.com/setup',
  },
  {
    id: 2,
    title: 'Review Company Handbook',
    description: 'Read and acknowledge company policies',
    role: 'All',
    owner: 'HR',
    expert: 'Jane Smith',
    status: 'completed',
    link: 'https://example.com/handbook',
  },
];

// ============================================================================
// Test Cases
// ============================================================================

describe('useSteps Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state and empty data', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToSteps).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useSteps('instance-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should update data when subscription receives steps', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToSteps).mockImplementation((_instanceId, callback) => {
      // Simulate receiving steps immediately
      callback(mockSteps);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useSteps('instance-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSteps);
    expect(result.current.error).toBeNull();
  });

  it('should handle error gracefully during subscription', async () => {
    const mockError = new Error('Subscription failed');
    vi.mocked(subscribeToSteps).mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useSteps('instance-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToSteps).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useSteps('instance-1'));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it('should resubscribe when instanceId changes', async () => {
    const mockUnsubscribe = vi.fn();
    let callCount = 0;

    vi.mocked(subscribeToSteps).mockImplementation((_instanceId, callback) => {
      callCount++;
      callback(mockSteps);
      return mockUnsubscribe;
    });

    const { rerender } = renderHook(
      ({ id }: { id: string }) => useSteps(id),
      { initialProps: { id: 'instance-1' } }
    );

    expect(callCount).toBe(1);

    rerender({ id: 'instance-2' });

    await waitFor(() => {
      expect(callCount).toBe(2);
    });

    // First subscription should be unsubscribed
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should return empty array while loading', () => {
    const mockUnsubscribe = vi.fn();
    // Don't call the callback to keep loading state
    vi.mocked(subscribeToSteps).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useSteps('instance-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('should handle empty steps array from subscription', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToSteps).mockImplementation((_instanceId, callback) => {
      callback([]);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useSteps('instance-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
