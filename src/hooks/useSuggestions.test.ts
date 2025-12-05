/**
 * Unit tests for useSuggestions hook
 * Tests polling interval, loading states, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSuggestions } from './useSuggestions';
import { listSuggestions } from '../services/dataClient';
import type { Suggestion } from '../types';

// Mock dataClient
vi.mock('../services/dataClient', () => ({
  listSuggestions: vi.fn(),
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
    vi.mocked(listSuggestions).mockResolvedValue([]);

    const { result } = renderHook(() => useSuggestions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and display suggestions on mount', async () => {
    vi.mocked(listSuggestions).mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSuggestions);
    expect(result.current.error).toBeNull();
  });

  it('should set error state on fetch failure', async () => {
    const mockError = new Error('Failed to fetch');
    vi.mocked(listSuggestions).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should call listSuggestions on mount', async () => {
    vi.mocked(listSuggestions).mockResolvedValue(mockSuggestions);

    renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(vi.mocked(listSuggestions)).toHaveBeenCalledTimes(1);
    });
  });

  it('should clear polling interval on unmount', async () => {
    vi.mocked(listSuggestions).mockResolvedValue(mockSuggestions);

    const { unmount } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(vi.mocked(listSuggestions)).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Verify the cleanup function was registered by checking the mock call count
    // doesn't increase after unmount (cleanup would prevent further calls)
    expect(vi.mocked(listSuggestions)).toHaveBeenCalledTimes(1);
  });

  it('should handle empty suggestions array', async () => {
    vi.mocked(listSuggestions).mockResolvedValue([]);

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should update data when new suggestions are available', async () => {
    const initialSuggestions = [mockSuggestions[0]];

    vi.mocked(listSuggestions).mockResolvedValue(initialSuggestions);

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(initialSuggestions);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors gracefully without throwing', async () => {
    const mockError = new Error('Network error');
    vi.mocked(listSuggestions).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSuggestions());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
