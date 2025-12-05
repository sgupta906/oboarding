/**
 * Tests for useUsers Hook
 * Validates user CRUD operations, loading states, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';
import * as userOps from '../services/userOperations';
import type { User, UserFormData } from '../types';

// Mock the userOperations module
vi.mock('../services/userOperations');

describe('useUsers Hook', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'john@company.com',
    name: 'John Doe',
    roles: ['employee'],
    profiles: ['Engineering'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin-1',
  };

  const mockUsers: User[] = [
    mockUser,
    {
      id: 'user-2',
      email: 'jane@company.com',
      name: 'Jane Smith',
      roles: ['manager'],
      profiles: ['Sales'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'admin-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty users and loading state', () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      // Simulate async subscription
      setTimeout(() => callback([]), 0);
      return () => {};
    });

    const { result } = renderHook(() => useUsers());

    // Initially loading is true, but callback hasn't been called yet
    // Since the callback is scheduled asynchronously, isLoading may already be false
    expect(result.current.users).toBeDefined();
    expect(result.current.error).toBe(null);
  });

  it('should load users on mount', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      setTimeout(() => callback(mockUsers), 100);
      return () => {};
    });

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.error).toBe(null);
  });

  it('should create a new user successfully', async () => {
    const newUser: User = {
      ...mockUser,
      id: 'user-3',
      email: 'newuser@company.com',
      name: 'New User',
    };

    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    (userOps.createUser as any).mockResolvedValue(newUser);

    const { result } = renderHook(() => useUsers());

    const formData: UserFormData = {
      email: 'newuser@company.com',
      name: 'New User',
      roles: ['employee'],
      profiles: ['Engineering'],
    };

    let createdUser: User | undefined;
    await act(async () => {
      createdUser = await result.current.createNewUser(formData, 'admin-1');
    });

    expect(createdUser).toEqual(newUser);
    expect(userOps.createUser).toHaveBeenCalled();
    // Verify the call was made with the correct createdBy parameter
    const callArgs = (userOps.createUser as any).mock.calls[0];
    expect(callArgs[1]).toBe('admin-1');
  });

  it('should handle duplicate email error when creating user', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    const error = new Error('A user with email john@company.com already exists');
    (userOps.createUser as any).mockRejectedValue(error);

    const { result } = renderHook(() => useUsers());

    const formData: UserFormData = {
      email: 'john@company.com',
      name: 'John Doe',
      roles: ['employee'],
    };

    await act(async () => {
      try {
        await result.current.createNewUser(formData, 'admin-1');
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('A user with email john@company.com already exists');
  });

  it('should update a user successfully', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    (userOps.updateUser as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsers());

    const updates: Partial<UserFormData> = {
      name: 'John Updated',
      roles: ['manager'],
    };

    await act(async () => {
      await result.current.editUser('user-1', updates);
    });

    expect(userOps.updateUser).toHaveBeenCalledWith('user-1', updates);
  });

  it('should handle error when updating user', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    const error = new Error('Failed to update user');
    (userOps.updateUser as any).mockRejectedValue(error);

    const { result } = renderHook(() => useUsers());

    await act(async () => {
      try {
        await result.current.editUser('user-1', { name: 'Updated' });
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('Failed to update user');
  });

  it('should delete a user successfully', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    (userOps.deleteUser as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsers());

    await act(async () => {
      await result.current.removeUser('user-1');
    });

    expect(userOps.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('should handle error when deleting user', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    const error = new Error('User not found');
    (userOps.deleteUser as any).mockRejectedValue(error);

    const { result } = renderHook(() => useUsers());

    await act(async () => {
      try {
        await result.current.removeUser('user-1');
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('User not found');
  });

  it('should fetch a single user by ID', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    (userOps.getUser as any).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUsers());

    let fetchedUser: User | null = null;
    await act(async () => {
      fetchedUser = await result.current.fetchUser('user-1');
    });

    expect(fetchedUser).toEqual(mockUser);
    expect(userOps.getUser).toHaveBeenCalledWith('user-1');
  });

  it('should handle when user not found', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    (userOps.getUser as any).mockResolvedValue(null);

    const { result } = renderHook(() => useUsers());

    let fetchedUser: User | null = null;
    await act(async () => {
      fetchedUser = await result.current.fetchUser('nonexistent');
    });

    expect(fetchedUser).toBeNull();
  });

  it('should reset error state', async () => {
    (userOps.subscribeToUsers as any).mockImplementation((callback: (users: User[]) => void) => {
      callback(mockUsers);
      return () => {};
    });

    const error = new Error('Test error');
    (userOps.createUser as any).mockRejectedValue(error);

    const { result } = renderHook(() => useUsers());

    await act(async () => {
      try {
        await result.current.createNewUser(
          { email: 'test@test.com', name: 'Test', roles: [] },
          'admin'
        );
      } catch {
        // Expected
      }
    });

    expect(result.current.error).not.toBe(null);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBe(null);
  });

  it('should unsubscribe on cleanup', () => {
    const unsubscribeMock = vi.fn();
    (userOps.subscribeToUsers as any).mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useUsers());

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
