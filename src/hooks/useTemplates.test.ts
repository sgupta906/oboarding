/**
 * Unit tests for useTemplates hook
 * Tests subscription lifecycle, loading states, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTemplates } from './useTemplates';
import { subscribeToTemplates } from '../services/supabase';
import type { Template } from '../types';

// Mock supabase service
vi.mock('../services/supabase', () => ({
  subscribeToTemplates: vi.fn(),
}));

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: 'Engineering Onboarding',
    description: 'Template for engineering team',
    role: 'Engineering',
    steps: [
      {
        id: 1,
        title: 'Setup Dev Environment',
        description: 'Install dev tools',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'John Doe',
        status: 'pending',
        link: '',
      },
    ],
    createdAt: Date.now(),
    isActive: true,
  },
  {
    id: 'template-2',
    name: 'Sales Onboarding',
    description: 'Template for sales team',
    role: 'Sales',
    steps: [
      {
        id: 1,
        title: 'CRM Training',
        description: 'Learn our CRM system',
        role: 'Sales',
        owner: 'Sales Ops',
        expert: 'Jane Smith',
        status: 'pending',
        link: '',
      },
    ],
    createdAt: Date.now(),
    isActive: true,
  },
];

// ============================================================================
// Test Cases
// ============================================================================

describe('useTemplates Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state and empty data', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToTemplates).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useTemplates());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should update data when subscription receives templates', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToTemplates).mockImplementation((callback) => {
      callback(mockTemplates);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockTemplates);
    expect(result.current.error).toBeNull();
  });

  it('should handle error gracefully during subscription', async () => {
    const mockError = new Error('Subscription failed');
    vi.mocked(subscribeToTemplates).mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToTemplates).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useTemplates());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it('should handle empty templates array from subscription', async () => {
    const mockUnsubscribe = vi.fn();

    vi.mocked(subscribeToTemplates).mockImplementation((callback) => {
      callback([]);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should provide refetch function', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToTemplates).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useTemplates());

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should resubscribe when refetch is called', async () => {
    const mockUnsubscribe = vi.fn();
    let callCount = 0;

    vi.mocked(subscribeToTemplates).mockImplementation((callback) => {
      callCount++;
      callback(mockTemplates);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useTemplates());

    expect(callCount).toBe(1);

    result.current.refetch();

    await waitFor(() => {
      expect(callCount).toBe(2);
    });
  });

  it('should unsubscribe previous subscription on refetch', async () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(subscribeToTemplates).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useTemplates());

    result.current.refetch();

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalledOnce();
    });
  });
});
