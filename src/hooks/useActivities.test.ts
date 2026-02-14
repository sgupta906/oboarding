/**
 * Unit tests for useActivities hook
 * Tests subscription lifecycle, loading states, and error handling
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivities } from './useActivities';
import { subscribeToActivities } from '../services/supabase';
import type { Activity } from '../types';

// Mock supabase service
vi.mock('../services/supabase', () => ({
  subscribeToActivities: vi.fn(),
}));

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    userInitials: 'JD',
    action: 'Started onboarding',
    timeAgo: '2 hours ago',
    timestamp: Date.now() - 7200000,
    userId: 'user-1',
    resourceType: 'instance',
    resourceId: 'instance-1',
  },
  {
    id: 'activity-2',
    userInitials: 'JS',
    action: 'Completed step: Setup Environment',
    timeAgo: '1 hour ago',
    timestamp: Date.now() - 3600000,
    userId: 'user-2',
    resourceType: 'step',
    resourceId: '1',
  },
  {
    id: 'activity-3',
    userInitials: 'SM',
    action: 'Reviewed suggestion',
    timeAgo: '30 minutes ago',
    timestamp: Date.now() - 1800000,
    userId: 'user-3',
    resourceType: 'suggestion',
    resourceId: 'sugg-1',
  },
];

// ============================================================================
// Test Cases
// ============================================================================

describe('useActivities Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state and empty data', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToActivities).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useActivities());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should update data when subscription receives activities', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToActivities).mockImplementation((callback) => {
      // Simulate receiving activities immediately
      callback(mockActivities);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockActivities);
    expect(result.current.error).toBeNull();
  });

  it('should handle error gracefully during subscription', async () => {
    const mockError = new Error('Subscription failed');
    vi.mocked(subscribeToActivities).mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToActivities).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useActivities());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it('should return empty array while loading', () => {
    const mockUnsubscribe = vi.fn();
    // Don't call the callback to keep loading state
    vi.mocked(subscribeToActivities).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useActivities());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('should handle empty activities array from subscription', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToActivities).mockImplementation((callback) => {
      callback([]);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple activity updates', async () => {
    const mockUnsubscribe = vi.fn();
    let callbackRef: any = null;

    vi.mocked(subscribeToActivities).mockImplementation((callback: any) => {
      callbackRef = callback;
      callback([mockActivities[0]]);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    // Simulate receiving an update
    if (callbackRef !== null) {
      callbackRef(mockActivities);
    }

    await waitFor(() => {
      expect(result.current.data).toEqual(mockActivities);
    });
  });
});
