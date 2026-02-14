/**
 * Unit tests for useSuggestions hook
 * Tests subscription lifecycle, loading states, and error handling
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSuggestions } from './useSuggestions';
import { subscribeToSuggestions } from '../services/supabase';
import type { Suggestion } from '../types';

// Mock supabase service
vi.mock('../services/supabase', () => ({
  subscribeToSuggestions: vi.fn(),
}));

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockSuggestions: Suggestion[] = [
  {
    id: 'sugg-1',
    stepId: 1,
    user: 'John Doe',
    text: 'The setup guide is unclear',
    status: 'pending',
    createdAt: Date.now(),
    instanceId: 'instance-1',
  },
  {
    id: 'sugg-2',
    stepId: 2,
    user: 'Jane Smith',
    text: 'Add more examples',
    status: 'reviewed',
    createdAt: Date.now() - 3600000,
    instanceId: 'instance-2',
  },
];

// ============================================================================
// Test Cases
// ============================================================================

describe('useSuggestions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state and empty data', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToSuggestions).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useSuggestions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should update data when subscription receives suggestions', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToSuggestions).mockImplementation((callback) => {
      // Simulate receiving suggestions immediately
      callback(mockSuggestions);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSuggestions);
    expect(result.current.error).toBeNull();
  });

  it('should handle error gracefully during subscription', async () => {
    const mockError = new Error('Subscription failed');
    vi.mocked(subscribeToSuggestions).mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToSuggestions).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useSuggestions());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it('should return empty array while loading', () => {
    const mockUnsubscribe = vi.fn();
    // Don't call the callback to keep loading state
    vi.mocked(subscribeToSuggestions).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useSuggestions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('should handle empty suggestions array from subscription', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToSuggestions).mockImplementation((callback) => {
      callback([]);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple suggestion updates', async () => {
    const mockUnsubscribe = vi.fn();
    let callbackRef: any = null;

    vi.mocked(subscribeToSuggestions).mockImplementation((callback: any) => {
      callbackRef = callback;
      callback([mockSuggestions[0]]);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    // Simulate receiving an update
    if (callbackRef !== null) {
      callbackRef(mockSuggestions);
    }

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSuggestions);
    });
  });
});
