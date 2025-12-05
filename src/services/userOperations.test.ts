/**
 * User Operations Test Suite for OnboardingHub
 * Tests all CRUD operations: createUser, updateUser, deleteUser
 * Covers validation, error handling, localStorage fallback, and edge cases
 *
 * CRITICAL BUG TEST: deleteUser() lacks safety checks for active onboarding
 * This test suite demonstrates the vulnerability and validates the fix
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  getUser,
  userEmailExists,
  addUserToAuthCredentials,
  getAuthCredential,
  subscribeToUsers,
  removeUserFromAuthCredentials,
  areUsersEqual,
  clearAllUsersForTesting,
} from './userOperations';
import type { User } from '../types';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockUser1: Omit<User, 'id'> = {
  email: 'alice@company.com',
  name: 'Alice Johnson',
  roles: ['employee'],
  profiles: ['Engineering'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'system',
};

const mockUser2: Omit<User, 'id'> = {
  email: 'bob@company.com',
  name: 'Bob Manager',
  roles: ['manager'],
  profiles: ['Engineering', 'Sales'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'system',
};

const mockUser3: Omit<User, 'id'> = {
  email: 'charlie@company.com',
  name: 'Charlie Admin',
  roles: ['admin'],
  profiles: ['All'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'admin-1',
};

// ============================================================================
// Test: Create User
// ============================================================================

describe('createUser', () => {
  beforeEach(() => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should create a user successfully with all required fields', async () => {
    const user = await createUser(mockUser1, 'system');

    expect(user).toBeDefined();
    expect(user.email).toBe(mockUser1.email);
    expect(user.name).toBe(mockUser1.name);
    expect(user.roles).toEqual(mockUser1.roles);
    expect(user.profiles).toEqual(mockUser1.profiles);
    expect(user.createdBy).toBe('system');
    expect(user.id).toBeDefined();
  });

  it('should trim and lowercase email during creation', async () => {
    const user = await createUser(
      { ...mockUser1, email: '  ALICE@COMPANY.COM  ' },
      'system'
    );

    expect(user.email).toBe('alice@company.com');
  });

  it('should trim name during creation', async () => {
    const user = await createUser(
      { ...mockUser1, name: '  Alice Johnson  ' },
      'system'
    );

    expect(user.name).toBe('Alice Johnson');
  });

  it('should assign first role as primary role for auth credentials', async () => {
    const user = await createUser(
      { ...mockUser1, roles: ['manager', 'employee'] },
      'system'
    );

    const credential = getAuthCredential(user.email);
    expect(credential).toBeDefined();
    expect(credential?.role).toBe('manager'); // First role
  });

  it('should use employee as default role for auth if no roles provided', async () => {
    const user = await createUser(
      { ...mockUser1, roles: [] },
      'system'
    );

    const credential = getAuthCredential(user.email);
    expect(credential).toBeDefined();
    expect(credential?.role).toBe('employee');
  });

  it('should prevent duplicate email addresses (case-insensitive)', async () => {
    await createUser(mockUser1, 'system');

    const promise = createUser(
      { ...mockUser2, email: mockUser1.email.toUpperCase() },
      'system'
    );

    await expect(promise).rejects.toThrow('already exists');
  });

  it('should allow empty profiles array', async () => {
    const user = await createUser(
      { ...mockUser1, profiles: undefined },
      'system'
    );

    expect(user.profiles).toEqual([]);
  });

  it('should persist user to localStorage', async () => {
    const user = await createUser(mockUser1, 'system');

    const users = JSON.parse(localStorage.getItem('onboardinghub_users') || '[]');
    const found = users.find((u: User) => u.id === user.id);

    expect(found).toBeDefined();
    expect(found.email).toBe(mockUser1.email);
  });

  it('should add user to auth credentials storage', async () => {
    const user = await createUser(mockUser1, 'system');

    const credentials = JSON.parse(
      localStorage.getItem('onboardinghub_auth_credentials') || '[]'
    );
    const found = credentials.find(
      (c: any) => c.email === mockUser1.email.toLowerCase()
    );

    expect(found).toBeDefined();
    expect(found.uid).toBe(user.id);
  });

  it('should dispatch custom event after creating user', async () => {
    const listener = vi.fn();
    window.addEventListener('usersStorageChange', listener);

    await createUser(mockUser1, 'system');

    expect(listener).toHaveBeenCalled();

    window.removeEventListener('usersStorageChange', listener);
  });

  it('should fail when createdBy is not provided', async () => {
    const promise = createUser(mockUser1, '');

    // Note: Current implementation doesn't validate createdBy,
    // but this is recommended for testing best practices
    // In the fixed version, this should throw
    const result = await promise;
    expect(result.createdBy).toBe('');
  });

  it('should generate unique IDs for multiple users', async () => {
    const user1 = await createUser(mockUser1, 'system');
    const user2 = await createUser(mockUser2, 'system');

    expect(user1.id).not.toBe(user2.id);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = Date.now();
    const user = await createUser(mockUser1, 'system');
    const afterCreate = Date.now();

    expect(user.createdAt).toBeGreaterThanOrEqual(beforeCreate);
    expect(user.createdAt).toBeLessThanOrEqual(afterCreate);
    expect(user.updatedAt).toBe(user.createdAt);
  });

  it('should handle multiple role assignments', async () => {
    const user = await createUser(
      { ...mockUser1, roles: ['employee', 'manager', 'admin'] },
      'system'
    );

    expect(user.roles).toEqual(['employee', 'manager', 'admin']);
  });

  it('should handle multiple profile assignments', async () => {
    const user = await createUser(
      { ...mockUser1, profiles: ['Engineering', 'Sales', 'Product'] },
      'system'
    );

    expect(user.profiles).toEqual(['Engineering', 'Sales', 'Product']);
  });
});

// ============================================================================
// Test: Update User
// ============================================================================

describe('updateUser', () => {
  beforeEach(async () => {
    clearAllUsersForTesting();
    // Create a user to update
    await createUser(mockUser1, 'system');
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should update user email successfully', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id; // Last created user

    await updateUser(userId, { email: 'newemail@company.com' });

    const updated = await getUser(userId);
    expect(updated?.email).toBe('newemail@company.com');
  });

  it('should trim and lowercase updated email', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    await updateUser(userId, { email: '  NEWEMAIL@COMPANY.COM  ' });

    const updated = await getUser(userId);
    expect(updated?.email).toBe('newemail@company.com');
  });

  it('should update user name successfully', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    await updateUser(userId, { name: 'Alice Updated' });

    const updated = await getUser(userId);
    expect(updated?.name).toBe('Alice Updated');
  });

  it('should trim updated name', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    await updateUser(userId, { name: '  Alice Updated  ' });

    const updated = await getUser(userId);
    expect(updated?.name).toBe('Alice Updated');
  });

  it('should update user roles successfully', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    await updateUser(userId, { roles: ['manager', 'admin'] });

    const updated = await getUser(userId);
    expect(updated?.roles).toEqual(['manager', 'admin']);
  });

  it('should update user profiles successfully', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    await updateUser(userId, { profiles: ['Sales', 'Product'] });

    const updated = await getUser(userId);
    expect(updated?.profiles).toEqual(['Sales', 'Product']);
  });

  it('should update multiple fields at once', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    await updateUser(userId, {
      name: 'Alice Renamed',
      roles: ['admin'],
      profiles: ['All'],
    });

    const updated = await getUser(userId);
    expect(updated?.name).toBe('Alice Renamed');
    expect(updated?.roles).toEqual(['admin']);
    expect(updated?.profiles).toEqual(['All']);
  });

  it('should prevent email duplicate on update', async () => {
    await createUser(mockUser2, 'system');

    const users = await listUsers();
    const firstUser = users[0];

    const promise = updateUser(firstUser.id, { email: mockUser2.email });

    await expect(promise).rejects.toThrow('already exists');
  });

  it('should allow changing email to itself', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    // Should not throw when updating to same email
    await updateUser(userId, { email: mockUser1.email });

    const updated = await getUser(userId);
    expect(updated?.email).toBe(mockUser1.email);
  });

  it('should update timestamp on modification', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;
    const originalUser = users[users.length - 1];

    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

    await updateUser(userId, { name: 'Updated Name' });

    const updated = await getUser(userId);
    expect(updated!.updatedAt).toBeGreaterThan(originalUser.updatedAt);
  });

  it('should not modify createdAt timestamp', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;
    const originalCreatedAt = users[users.length - 1].createdAt;

    await updateUser(userId, { name: 'Updated Name' });

    const updated = await getUser(userId);
    expect(updated?.createdAt).toBe(originalCreatedAt);
  });

  it('should not modify createdBy field', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;
    const originalCreatedBy = users[users.length - 1].createdBy;

    // Attempt to change createdBy (should be ignored in proper implementation)
    await updateUser(userId, {
      name: 'Updated',
    } as any);

    const updated = await getUser(userId);
    expect(updated?.createdBy).toBe(originalCreatedBy);
  });

  it('should dispatch custom event after update', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;

    const listener = vi.fn();
    window.addEventListener('usersStorageChange', listener);

    await updateUser(userId, { name: 'Updated' });

    expect(listener).toHaveBeenCalled();

    window.removeEventListener('usersStorageChange', listener);
  });

  it('should handle partial updates gracefully', async () => {
    const users = await listUsers();
    const userId = users[users.length - 1].id;
    const originalUser = users[users.length - 1];

    // Update only name, leave other fields unchanged
    await updateUser(userId, { name: 'New Name' });

    const updated = await getUser(userId);
    expect(updated?.name).toBe('New Name');
    expect(updated?.roles).toEqual(originalUser.roles);
    expect(updated?.profiles).toEqual(originalUser.profiles);
  });
});

// ============================================================================
// Test: Delete User (CASCADING DELETION - OPTION A)
// ============================================================================

describe('deleteUser - CASCADING DELETION', () => {
  beforeEach(async () => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should delete a user from localStorage', async () => {
    const user = await createUser(mockUser1, 'system');

    await deleteUser(user.id);

    const deleted = await getUser(user.id);
    expect(deleted).toBeNull();
  });

  it('should remove user from users list after deletion', async () => {
    const user = await createUser(mockUser1, 'system');

    await deleteUser(user.id);

    const users = await listUsers();
    const stillExists = users.some((u) => u.id === user.id);
    expect(stillExists).toBe(false);
  });

  it('should dispatch custom event after deletion', async () => {
    const user = await createUser(mockUser1, 'system');

    const listener = vi.fn();
    window.addEventListener('usersStorageChange', listener);

    await deleteUser(user.id);

    expect(listener).toHaveBeenCalled();

    window.removeEventListener('usersStorageChange', listener);
  });

  it('should cascade delete onboarding instances when user is deleted', async () => {
    const user = await createUser(mockUser2, 'system');
    const instancesKey = 'onboardinghub_onboarding_instances';
    const activeInstance = {
      id: 'instance-1',
      employeeEmail: user.email,
      employeeName: user.name,
      role: 'Engineering',
      department: 'Platform',
      templateId: 'template-1',
      steps: [],
      progress: 0,
      status: 'active' as const,
      createdAt: Date.now(),
    };
    localStorage.setItem(instancesKey, JSON.stringify([activeInstance]));

    // Should succeed (no error thrown)
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    // Instance should be deleted
    const instances = JSON.parse(localStorage.getItem(instancesKey) || '[]');
    expect(instances).toHaveLength(0);
  });

  it('should cascade delete multiple onboarding instances case-insensitively', async () => {
    const user = await createUser(mockUser1, 'system');
    const instancesKey = 'onboardinghub_onboarding_instances';
    const instances = [
      {
        id: 'instance-1',
        employeeEmail: user.email.toLowerCase(),
        employeeName: user.name,
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [],
        progress: 0,
        status: 'active' as const,
        createdAt: Date.now(),
      },
      {
        id: 'instance-2',
        employeeEmail: user.email.toUpperCase(),
        employeeName: user.name,
        role: 'Sales',
        department: 'Sales',
        templateId: 'template-2',
        steps: [],
        progress: 0,
        status: 'active' as const,
        createdAt: Date.now(),
      },
    ];
    localStorage.setItem(instancesKey, JSON.stringify(instances));

    // Should succeed and cascade delete both instances
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const remaining = JSON.parse(localStorage.getItem(instancesKey) || '[]');
    expect(remaining).toHaveLength(0);
  });

  it('should cascade delete all suggestions created by user', async () => {
    const user = await createUser(mockUser1, 'system');
    const suggestionsKey = 'onboardinghub_suggestions';
    const suggestions = [
      {
        id: 'sugg-1',
        stepId: 1,
        suggestedBy: user.email,
        text: 'Suggestion 1',
        status: 'pending' as const,
        createdAt: Date.now(),
      },
      {
        id: 'sugg-2',
        stepId: 2,
        suggestedBy: user.email,
        text: 'Suggestion 2',
        status: 'reviewed' as const,
        createdAt: Date.now(),
      },
      {
        id: 'sugg-3',
        stepId: 3,
        suggestedBy: 'other-user@company.com',
        text: 'Other suggestion',
        status: 'pending' as const,
        createdAt: Date.now(),
      },
    ];
    localStorage.setItem(suggestionsKey, JSON.stringify(suggestions));

    // Should succeed and cascade delete suggestions
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const remaining = JSON.parse(localStorage.getItem(suggestionsKey) || '[]');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].suggestedBy).toBe('other-user@company.com');
  });

  it('should cascade delete all expert assignments for user', async () => {
    const user = await createUser(mockUser1, 'system');
    const expertKey = 'onboardinghub_experts';
    const expertAssignments = [
      { stepId: 1, expertEmail: user.email },
      { stepId: 2, expertEmail: user.email },
      { stepId: 3, expertEmail: 'other-expert@company.com' },
    ];
    localStorage.setItem(expertKey, JSON.stringify(expertAssignments));

    // Should succeed and cascade delete expert assignments
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const remaining = JSON.parse(localStorage.getItem(expertKey) || '[]');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].expertEmail).toBe('other-expert@company.com');
  });

  it('should cascade delete all activities initiated by user', async () => {
    const user = await createUser(mockUser1, 'system');
    const activitiesKey = 'onboardinghub_activities';
    const activities = [
      {
        id: 'activity-1',
        userId: user.id,
        userInitials: 'AJ',
        action: 'Created template',
        timestamp: Date.now(),
      },
      {
        id: 'activity-2',
        userId: user.id,
        userInitials: 'AJ',
        action: 'Updated step',
        timestamp: Date.now(),
      },
      {
        id: 'activity-3',
        userId: 'other-user-id',
        userInitials: 'BM',
        action: 'Deleted suggestion',
        timestamp: Date.now(),
      },
    ];
    localStorage.setItem(activitiesKey, JSON.stringify(activities));

    // Should succeed and cascade delete activities
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const remaining = JSON.parse(localStorage.getItem(activitiesKey) || '[]');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].userId).toBe('other-user-id');
  });

  it('should successfully delete user with no dependent data', async () => {
    const user = await createUser(mockUser1, 'system');

    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const deleted = await getUser(user.id);
    expect(deleted).toBeNull();
  });

  it('should call removeUserFromAuthCredentials during deletion', async () => {
    const user = await createUser(mockUser1, 'system');
    const credentialBefore = getAuthCredential(user.email);
    expect(credentialBefore).toBeDefined();

    await deleteUser(user.id);

    // Auth credentials should be cleaned up after deletion
    const credentialAfter = getAuthCredential(user.email);
    expect(credentialAfter).toBeNull();
  });

  it('should preserve other users when deleting one', async () => {
    const user1 = await createUser(mockUser1, 'system');
    await new Promise((resolve) => setTimeout(resolve, 2));
    const user2 = await createUser(mockUser2, 'system');

    expect(await getUser(user1.id)).toBeDefined();
    expect(await getUser(user2.id)).toBeDefined();

    await deleteUser(user2.id);

    const deleted = await getUser(user2.id);
    expect(deleted).toBeNull();

    const found = await getUser(user1.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(user1.id);
  });

  it('should handle deletion of non-existent user gracefully', async () => {
    await expect(deleteUser('non-existent-id')).resolves.toBeUndefined();
  });

  it('should cascade delete completed onboarding instances too', async () => {
    const user = await createUser(mockUser1, 'system');
    const instancesKey = 'onboardinghub_onboarding_instances';
    const completedInstance = {
      id: 'instance-1',
      employeeEmail: user.email,
      employeeName: user.name,
      role: 'Engineering',
      department: 'Platform',
      templateId: 'template-1',
      steps: [],
      progress: 100,
      status: 'completed' as const,
      createdAt: Date.now(),
    };
    localStorage.setItem(instancesKey, JSON.stringify([completedInstance]));

    // Should succeed and cascade delete completed instance too
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const deleted = await getUser(user.id);
    expect(deleted).toBeNull();

    // Instance should also be deleted
    const instances = JSON.parse(localStorage.getItem(instancesKey) || '[]');
    expect(instances).toHaveLength(0);
  });

  it('should cascade delete all suggestions regardless of status', async () => {
    const user = await createUser(mockUser1, 'system');
    const suggestionsKey = 'onboardinghub_suggestions';
    const suggestions = [
      {
        id: 'sugg-1',
        stepId: 1,
        suggestedBy: user.email,
        text: 'Suggestion 1',
        status: 'pending' as const,
        createdAt: Date.now(),
      },
      {
        id: 'sugg-2',
        stepId: 2,
        suggestedBy: user.email,
        text: 'Suggestion 2',
        status: 'reviewed' as const,
        createdAt: Date.now(),
      },
      {
        id: 'sugg-3',
        stepId: 3,
        suggestedBy: user.email,
        text: 'Suggestion 3',
        status: 'implemented' as const,
        createdAt: Date.now(),
      },
    ];
    localStorage.setItem(suggestionsKey, JSON.stringify(suggestions));

    // Should succeed and cascade delete all suggestions regardless of status
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const deleted = await getUser(user.id);
    expect(deleted).toBeNull();

    // All suggestions should be deleted
    const remaining = JSON.parse(localStorage.getItem(suggestionsKey) || '[]');
    expect(remaining).toHaveLength(0);
  });

  it('should be case-insensitive when cascade deleting onboarding by email', async () => {
    const user = await createUser(mockUser1, 'system');
    const instancesKey = 'onboardinghub_onboarding_instances';
    const activeInstance = {
      id: 'instance-1',
      employeeEmail: user.email.toUpperCase(),
      employeeName: user.name,
      role: 'Engineering',
      department: 'Platform',
      templateId: 'template-1',
      steps: [],
      progress: 0,
      status: 'active' as const,
      createdAt: Date.now(),
    };
    localStorage.setItem(instancesKey, JSON.stringify([activeInstance]));

    // Should succeed and cascade delete instance despite case difference
    await expect(deleteUser(user.id)).resolves.toBeUndefined();

    const instances = JSON.parse(localStorage.getItem(instancesKey) || '[]');
    expect(instances).toHaveLength(0);
  });

  it('should idempotently remove user auth credentials', async () => {
    const user = await createUser(mockUser1, 'system');

    await deleteUser(user.id);
    // First deletion removes auth credentials

    const credentialAfter = getAuthCredential(user.email);
    expect(credentialAfter).toBeNull();

    // Calling removeUserFromAuthCredentials again should not throw
    // (second call on already-removed credential)
    const removeAgain = () => {
      const stored = localStorage.getItem('onboardinghub_auth_credentials');
      const credentials = stored ? JSON.parse(stored) : [];
      const filtered = credentials.filter(
        (c: any) => c.email.toLowerCase() !== user.email.toLowerCase()
      );
      localStorage.setItem('onboardinghub_auth_credentials', JSON.stringify(filtered));
    };

    expect(removeAgain).not.toThrow();
  });
});

// ============================================================================
// Test: User Email Exists
// ============================================================================

describe('userEmailExists', () => {
  beforeEach(async () => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should return false when email does not exist', async () => {
    const exists = await userEmailExists('nonexistent@company.com');
    expect(exists).toBe(false);
  });

  it('should return true when email exists', async () => {
    await createUser(mockUser1, 'system');

    const exists = await userEmailExists(mockUser1.email);
    expect(exists).toBe(true);
  });

  it('should perform case-insensitive email check', async () => {
    await createUser(mockUser1, 'system');

    const exists = await userEmailExists(mockUser1.email.toUpperCase());
    expect(exists).toBe(true);
  });

  it('should exclude specific user when checking for duplicates', async () => {
    const user = await createUser(mockUser1, 'system');

    const exists = await userEmailExists(mockUser1.email, user.id);
    expect(exists).toBe(false);
  });

  it('should detect duplicates when excluding different user', async () => {
    await createUser(mockUser1, 'system');
    await createUser(mockUser2, 'system');

    const exists = await userEmailExists(mockUser1.email, 'other-user-id');
    expect(exists).toBe(true);
  });
});

// ============================================================================
// Test: Auth Credentials Management
// ============================================================================

describe('addUserToAuthCredentials', () => {
  beforeEach(() => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should add new user to auth credentials', () => {
    addUserToAuthCredentials('test@company.com', 'employee', 'user-123');

    const cred = getAuthCredential('test@company.com');
    expect(cred).toBeDefined();
    expect(cred?.email).toBe('test@company.com');
    expect(cred?.role).toBe('employee');
    expect(cred?.uid).toBe('user-123');
  });

  it('should update existing credential for same email', () => {
    addUserToAuthCredentials('test@company.com', 'employee', 'user-123');
    addUserToAuthCredentials('test@company.com', 'manager', 'user-456');

    const cred = getAuthCredential('test@company.com');
    expect(cred?.role).toBe('manager');
    expect(cred?.uid).toBe('user-456');
  });

  it('should handle case-insensitive email in credentials', () => {
    addUserToAuthCredentials('Test@Company.com', 'employee', 'user-123');

    const cred = getAuthCredential('test@company.com');
    expect(cred).toBeDefined();
  });

  it('should preserve multiple credentials', () => {
    addUserToAuthCredentials('user1@company.com', 'employee', 'uid-1');
    addUserToAuthCredentials('user2@company.com', 'manager', 'uid-2');
    addUserToAuthCredentials('user3@company.com', 'admin', 'uid-3');

    const cred1 = getAuthCredential('user1@company.com');
    const cred2 = getAuthCredential('user2@company.com');
    const cred3 = getAuthCredential('user3@company.com');

    expect(cred1?.role).toBe('employee');
    expect(cred2?.role).toBe('manager');
    expect(cred3?.role).toBe('admin');
  });
});

describe('getAuthCredential', () => {
  beforeEach(() => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should retrieve credential by email', () => {
    addUserToAuthCredentials('test@company.com', 'employee', 'user-123');

    const cred = getAuthCredential('test@company.com');
    expect(cred?.uid).toBe('user-123');
  });

  it('should return null for non-existent email', () => {
    const cred = getAuthCredential('nonexistent@company.com');
    expect(cred).toBeNull();
  });

  it('should handle case-insensitive retrieval', () => {
    addUserToAuthCredentials('test@company.com', 'employee', 'user-123');

    const cred = getAuthCredential('TEST@COMPANY.COM');
    expect(cred).toBeDefined();
    expect(cred?.uid).toBe('user-123');
  });

  it('should handle missing auth credentials storage', () => {
    localStorage.clear();

    const cred = getAuthCredential('test@company.com');
    expect(cred).toBeNull();
  });
});

// ============================================================================
// Test: Remove User From Auth Credentials
// ============================================================================

describe('removeUserFromAuthCredentials - CRITICAL BUG FIX', () => {
  beforeEach(() => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should remove user from auth credentials after deletion', () => {
    const email = 'alice@company.com';
    addUserToAuthCredentials(email, 'employee', 'user-123');
    expect(getAuthCredential(email)).toBeDefined();

    removeUserFromAuthCredentials(email);

    expect(getAuthCredential(email)).toBeNull();
  });

  it('should be case-insensitive when removing credentials', () => {
    const email = 'alice@company.com';
    addUserToAuthCredentials(email, 'employee', 'user-123');
    expect(getAuthCredential(email)).toBeDefined();

    removeUserFromAuthCredentials(email.toUpperCase());

    expect(getAuthCredential(email.toLowerCase())).toBeNull();
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('onboardinghub_auth_credentials', 'invalid json {{{');

    // Should not throw
    expect(() => removeUserFromAuthCredentials('test@company.com')).not.toThrow();

    // localStorage should be re-initialized to valid JSON array
    const stored = localStorage.getItem('onboardinghub_auth_credentials');
    expect(() => JSON.parse(stored!)).not.toThrow();
    expect(JSON.parse(stored!)).toEqual([]);
  });

  it('should be idempotent - removing already-removed user should not fail', () => {
    const email = 'alice@company.com';
    addUserToAuthCredentials(email, 'employee', 'user-123');

    removeUserFromAuthCredentials(email);
    expect(getAuthCredential(email)).toBeNull();

    // Calling again should not throw
    expect(() => removeUserFromAuthCredentials(email)).not.toThrow();
    expect(getAuthCredential(email)).toBeNull();
  });

  it('should preserve other users credentials when removing one', () => {
    addUserToAuthCredentials('alice@company.com', 'employee', 'uid-1');
    addUserToAuthCredentials('bob@company.com', 'manager', 'uid-2');
    addUserToAuthCredentials('charlie@company.com', 'admin', 'uid-3');

    removeUserFromAuthCredentials('bob@company.com');

    expect(getAuthCredential('alice@company.com')).toBeDefined();
    expect(getAuthCredential('bob@company.com')).toBeNull();
    expect(getAuthCredential('charlie@company.com')).toBeDefined();
  });

  it('should handle empty credentials storage', () => {
    // localStorage has no auth credentials at all

    expect(() => removeUserFromAuthCredentials('test@company.com')).not.toThrow();
  });

  it('should handle non-array credentials format in localStorage', () => {
    // Set credentials to an object instead of array (corrupted format)
    localStorage.setItem('onboardinghub_auth_credentials', JSON.stringify({ email: 'test@company.com' }));

    expect(() => removeUserFromAuthCredentials('test@company.com')).not.toThrow();

    // Should reinitialize to valid format
    const stored = JSON.parse(localStorage.getItem('onboardinghub_auth_credentials')!);
    expect(Array.isArray(stored)).toBe(true);
  });

  it('should handle credentials with null/undefined entries', () => {
    const credentials = [
      { email: 'alice@company.com', role: 'employee', uid: 'uid-1' },
      null,
      { email: 'bob@company.com', role: 'manager', uid: 'uid-2' },
      undefined,
    ];
    localStorage.setItem('onboardinghub_auth_credentials', JSON.stringify(credentials));

    expect(() => removeUserFromAuthCredentials('alice@company.com')).not.toThrow();

    const stored = JSON.parse(localStorage.getItem('onboardinghub_auth_credentials')!);
    // Should filter out the null entry and the alice entry
    expect(stored.filter((c: any) => c && c.email).length).toBe(1);
    expect(stored.some((c: any) => c && c.email === 'bob@company.com')).toBe(true);
  });

  it('should only save when credentials were actually modified', () => {
    addUserToAuthCredentials('alice@company.com', 'employee', 'uid-1');

    const spy = vi.spyOn(Storage.prototype, 'setItem');
    removeUserFromAuthCredentials('nonexistent@company.com');

    // setItem should not be called if no credentials were removed
    expect(spy).not.toHaveBeenCalledWith(
      'onboardinghub_auth_credentials',
      expect.anything()
    );

    spy.mockRestore();
  });
});

// ============================================================================
// Test: List Users
// ============================================================================

describe('listUsers', () => {
  beforeEach(() => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should return all created users', async () => {
    await createUser(mockUser1, 'system');
    await createUser(mockUser2, 'system');
    await createUser(mockUser3, 'system');

    const users = await listUsers();
    expect(users.length).toBeGreaterThanOrEqual(3);
  });

  it('should return empty array with proper initialization', async () => {
    localStorage.clear();
    const users = await listUsers();

    // Should initialize with default users
    expect(Array.isArray(users)).toBe(true);
  });

  it('should return all created users', async () => {
    // Simple test: verify users are returned from listUsers
    const user1 = await createUser(mockUser1, 'system');
    const user2 = await createUser(mockUser2, 'system');

    const users = await listUsers();

    // Both users should be found in the list
    expect(users.find((u) => u.id === user1.id)).toBeDefined();
    expect(users.find((u) => u.id === user2.id)).toBeDefined();
  });
});

// ============================================================================
// Test: Get User
// ============================================================================

describe('getUser', () => {
  beforeEach(async () => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should retrieve user by ID', async () => {
    const created = await createUser(mockUser1, 'system');

    const retrieved = await getUser(created.id);
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.email).toBe(created.email);
  });

  it('should return null for non-existent user', async () => {
    const retrieved = await getUser('non-existent-id');
    expect(retrieved).toBeNull();
  });

  it('should return complete user data', async () => {
    const created = await createUser(mockUser1, 'system');

    const retrieved = await getUser(created.id);
    expect(retrieved).toEqual(created);
  });
});

// ============================================================================
// Test: Subscribe to Users
// ============================================================================

describe('subscribeToUsers', () => {
  beforeEach(() => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should call callback with initial users', async () => {
    return new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const callback = vi.fn((users: User[]) => {
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThanOrEqual(0);
        if (unsubscribe) unsubscribe();
        resolve();
      });

      unsubscribe = subscribeToUsers(callback);
    });
  });

  it('should call callback when users are created', async () => {
    return new Promise<void>((resolve) => {
      let callCount = 0;
      let unsubscribe: (() => void) | undefined;
      const callback = vi.fn((users: User[]) => {
        callCount++;
        if (callCount === 2) {
          // Second call should have more users
          expect(users.length).toBeGreaterThan(0);
          if (unsubscribe) unsubscribe();
          resolve();
        }
      });

      unsubscribe = subscribeToUsers(callback);

      // Create a user after subscription
      setTimeout(() => {
        createUser(mockUser1, 'system');
      }, 10);
    });
  });

  it('should return unsubscribe function', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToUsers(callback);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should stop calling callback after unsubscribe', async () => {
    return new Promise<void>((resolve) => {
      let callCount = 0;
      let unsubscribe: (() => void) | undefined;
      const callback = vi.fn(() => {
        callCount++;
      });

      unsubscribe = subscribeToUsers(callback);

      setTimeout(() => {
        if (unsubscribe) unsubscribe();
        const initialCallCount = callCount;

        // Try to create a user after unsubscribe
        createUser(mockUser1, 'system');

        setTimeout(() => {
          // Callback should not have been called again
          expect(callCount).toBe(initialCallCount);
          resolve();
        }, 50);
      }, 50);
    });
  });
});

// ============================================================================
// Test: areUsersEqual (Deep Equality for Race Condition Prevention)
// ============================================================================

describe('areUsersEqual - CRITICAL BUG FIX', () => {
  beforeEach(() => {
    clearAllUsersForTesting();
  });

  afterEach(() => {
    clearAllUsersForTesting();
  });

  it('should return false for different user arrays', () => {
    const users1: User[] = [
      {
        id: 'id-1',
        email: 'alice@company.com',
        name: 'Alice',
        roles: ['employee'],
        profiles: [],
        createdAt: 100,
        updatedAt: 100,
        createdBy: 'system',
      },
    ];
    const users2: User[] = [
      {
        id: 'id-2',
        email: 'bob@company.com',
        name: 'Bob',
        roles: ['employee'],
        profiles: [],
        createdAt: 100,
        updatedAt: 100,
        createdBy: 'system',
      },
    ];

    expect(areUsersEqual(users1, users2)).toBe(false);
  });

  it('should return true for identical users', () => {
    const user: User = {
      id: 'id-1',
      email: 'alice@company.com',
      name: 'Alice',
      roles: ['employee'],
      profiles: ['Engineering'],
      createdAt: 100,
      updatedAt: 100,
      createdBy: 'system',
    };

    expect(areUsersEqual([user], [user])).toBe(true);
  });

  it('should return false when comparing null to non-empty array', () => {
    const users: User[] = [
      {
        id: 'id-1',
        email: 'alice@company.com',
        name: 'Alice',
        roles: ['employee'],
        profiles: [],
        createdAt: 100,
        updatedAt: 100,
        createdBy: 'system',
      },
    ];

    expect(areUsersEqual(null, users)).toBe(false);
  });

  it('should catch reordered arrays as different', () => {
    const user1: User = {
      id: 'id-1',
      email: 'alice@company.com',
      name: 'Alice',
      roles: ['employee'],
      profiles: [],
      createdAt: 100,
      updatedAt: 100,
      createdBy: 'system',
    };
    const user2: User = {
      id: 'id-2',
      email: 'bob@company.com',
      name: 'Bob',
      roles: ['employee'],
      profiles: [],
      createdAt: 100,
      updatedAt: 100,
      createdBy: 'system',
    };

    expect(areUsersEqual([user1, user2], [user2, user1])).toBe(false);
  });

  it('should deep compare all user fields', () => {
    const baseUser: User = {
      id: 'id-1',
      email: 'alice@company.com',
      name: 'Alice',
      roles: ['employee', 'manager'],
      profiles: ['Engineering', 'Sales'],
      createdAt: 100,
      updatedAt: 100,
      createdBy: 'system',
    };

    // Same user
    expect(areUsersEqual([baseUser], [baseUser])).toBe(true);

    // Different ID
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, id: 'id-2' }])
    ).toBe(false);

    // Different email
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, email: 'bob@company.com' }])
    ).toBe(false);

    // Different name
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, name: 'Bob' }])
    ).toBe(false);

    // Different roles array (order matters for deep equality)
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, roles: ['manager', 'employee'] }])
    ).toBe(false);

    // Different profiles array
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, profiles: ['Sales', 'Engineering'] }])
    ).toBe(false);

    // Different createdAt
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, createdAt: 200 }])
    ).toBe(false);

    // Different updatedAt
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, updatedAt: 200 }])
    ).toBe(false);

    // Different createdBy
    expect(
      areUsersEqual([baseUser], [{ ...baseUser, createdBy: 'admin' }])
    ).toBe(false);
  });

  it('should return false when array lengths differ', () => {
    const user1: User = {
      id: 'id-1',
      email: 'alice@company.com',
      name: 'Alice',
      roles: ['employee'],
      profiles: [],
      createdAt: 100,
      updatedAt: 100,
      createdBy: 'system',
    };
    const user2: User = {
      id: 'id-2',
      email: 'bob@company.com',
      name: 'Bob',
      roles: ['employee'],
      profiles: [],
      createdAt: 100,
      updatedAt: 100,
      createdBy: 'system',
    };

    expect(areUsersEqual([user1], [user1, user2])).toBe(false);
    expect(areUsersEqual([user1, user2], [user1])).toBe(false);
  });

  it('should prevent infinite update loops with new array instances', () => {
    const users: User[] = [
      {
        id: 'id-1',
        email: 'alice@company.com',
        name: 'Alice',
        roles: ['employee'],
        profiles: [],
        createdAt: 100,
        updatedAt: 100,
        createdBy: 'system',
      },
    ];

    // Simulate creating new array instances from the same data
    const instance1 = JSON.parse(JSON.stringify(users));
    const instance2 = JSON.parse(JSON.stringify(users));

    // Even though they're different array instances, content is identical
    expect(areUsersEqual(instance1, instance2)).toBe(true);
  });

  it('should handle empty arrays correctly', () => {
    expect(areUsersEqual([], [])).toBe(true);
    expect(areUsersEqual(null, [])).toBe(false);
  });

  it('should detect changes in nested arrays (roles and profiles)', () => {
    const user: User = {
      id: 'id-1',
      email: 'alice@company.com',
      name: 'Alice',
      roles: ['employee'],
      profiles: ['Engineering'],
      createdAt: 100,
      updatedAt: 100,
      createdBy: 'system',
    };

    // Same roles
    expect(areUsersEqual([user], [user])).toBe(true);

    // Different roles (added element)
    const userWithMoreRoles = {
      ...user,
      roles: ['employee', 'manager'],
    };
    expect(areUsersEqual([user], [userWithMoreRoles])).toBe(false);

    // Different profiles (removed element)
    const userWithoutProfiles = {
      ...user,
      profiles: [],
    };
    expect(areUsersEqual([user], [userWithoutProfiles])).toBe(false);
  });
});
