/**
 * useSuggestions Hook Tests - Verify optimistic update and rollback behavior
 * Tests: optimisticUpdateStatus, optimisticRemove, rollback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the services
const mockSubscribeToSuggestions = vi.fn();

vi.mock('../services/supabase', () => ({
  subscribeToSuggestions: (...args: any[]) => mockSubscribeToSuggestions(...args),
}));

import { useSuggestions } from './useSuggestions';
import type { Suggestion } from '../types';

const makeSuggestion = (id: number, status: 'pending' | 'reviewed' | 'implemented' = 'pending'): Suggestion => ({
  id,
  stepId: 1,
  user: 'Test User',
  text: `Suggestion ${id}`,
  status,
});

describe('useSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSubscribeToSuggestions.mockImplementation((cb: (suggestions: Suggestion[]) => void) => {
      cb([makeSuggestion(1), makeSuggestion(2), makeSuggestion(3)]);
      return () => {};
    });
  });

  it('optimisticUpdateStatus changes suggestion status in data', () => {
    const { result } = renderHook(() => useSuggestions(true));

    expect(result.current.data[0].status).toBe('pending');

    act(() => {
      result.current.optimisticUpdateStatus(1, 'reviewed');
    });

    expect(result.current.data[0].status).toBe('reviewed');
    expect(result.current.data[1].status).toBe('pending'); // Others unchanged
  });

  it('optimisticRemove removes suggestion from data', () => {
    const { result } = renderHook(() => useSuggestions(true));

    expect(result.current.data).toHaveLength(3);

    act(() => {
      result.current.optimisticRemove(2);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data.find(s => s.id === 2)).toBeUndefined();
  });

  it('rollback restores original data on error', () => {
    const { result } = renderHook(() => useSuggestions(true));

    let snapshot: Suggestion[];

    act(() => {
      snapshot = result.current.optimisticUpdateStatus(1, 'reviewed');
    });

    expect(result.current.data[0].status).toBe('reviewed');

    act(() => {
      result.current.rollback(snapshot!);
    });

    expect(result.current.data[0].status).toBe('pending');
  });
});
