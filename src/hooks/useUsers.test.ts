/**
 * Tests for useUsers Hook
 * Validates user CRUD operations, error handling, and state reset
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsers } from './useUsers';
import * as userOps from '../services/supabase';
import type { User, UserFormData } from '../types';

// Mock the supabase service module
vi.mock('../services/supabase', () => ({
  subscribeToUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUser: vi.fn(),
}));

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
});
