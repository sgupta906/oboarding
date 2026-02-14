/**
 * Unit tests for roleClient.ts
 * Tests role validation, CRUD operations, seeding, and error handling
 * Comprehensive coverage of all scenarios including edge cases
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateRoleName,
  validateRoleNameUniqueness,
  validateRoleDescription,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  seedDefaultRoles,
  hasDefaultRoles,
} from './roleClient';
import {
  listRoles,
  createRole as dbCreateRole,
  updateRole as dbUpdateRole,
  deleteRole as dbDeleteRole,
  roleNameExists,
  isRoleInUse,
} from './supabase';
import type { CustomRole } from '../types';

// Mock the supabase service module
vi.mock('./supabase', () => ({
  listRoles: vi.fn(),
  getRole: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  roleNameExists: vi.fn(),
  isRoleInUse: vi.fn(),
}));

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockRole: CustomRole = {
  id: 'role-1',
  name: 'Engineering',
  description: 'Engineering team members',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'user-1',
};

const mockRoles: CustomRole[] = [
  {
    id: 'role-1',
    name: 'Engineering',
    description: 'Engineering team members',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  },
  {
    id: 'role-2',
    name: 'Sales',
    description: 'Sales team members',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  },
];

// ============================================================================
// Test: Role Name Validation
// ============================================================================

describe('validateRoleName', () => {
  it('should validate a valid role name', () => {
    const result = validateRoleName('Engineering');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept role names with spaces', () => {
    const result = validateRoleName('Product Manager');
    expect(result.valid).toBe(true);
  });

  it('should accept role names with hyphens', () => {
    const result = validateRoleName('Senior-Engineer');
    expect(result.valid).toBe(true);
  });

  it('should accept role names with numbers', () => {
    const result = validateRoleName('Level3 Manager');
    expect(result.valid).toBe(true);
  });

  it('should reject empty strings', () => {
    const result = validateRoleName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject null values', () => {
    const result = validateRoleName(null as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('non-empty string');
  });

  it('should reject undefined values', () => {
    const result = validateRoleName(undefined as any);
    expect(result.valid).toBe(false);
  });

  it('should reject names shorter than 2 characters', () => {
    const result = validateRoleName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 2 characters');
  });

  it('should reject names longer than 50 characters', () => {
    const longName = 'A'.repeat(51);
    const result = validateRoleName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not exceed 50 characters');
  });

  it('should reject names with special characters (except hyphen)', () => {
    const result = validateRoleName('Engineer@Manager');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('letters, numbers, spaces, and hyphens');
  });

  it('should reject names with underscores', () => {
    const result = validateRoleName('Senior_Engineer');
    expect(result.valid).toBe(false);
  });

  it('should reject names with dots', () => {
    const result = validateRoleName('Senior.Engineer');
    expect(result.valid).toBe(false);
  });

  it('should reject whitespace-only names', () => {
    const result = validateRoleName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('whitespace');
  });

  it('should trim whitespace from names during validation', () => {
    const result = validateRoleName('  Engineering  ');
    expect(result.valid).toBe(true);
  });

  it('should reject names at minimum boundary minus 1 character', () => {
    const result = validateRoleName('A');
    expect(result.valid).toBe(false);
  });

  it('should accept names at minimum boundary', () => {
    const result = validateRoleName('AB');
    expect(result.valid).toBe(true);
  });

  it('should accept names at maximum boundary', () => {
    const maxName = 'A'.repeat(50);
    const result = validateRoleName(maxName);
    expect(result.valid).toBe(true);
  });

  it('should reject names over maximum boundary', () => {
    const overMaxName = 'A'.repeat(51);
    const result = validateRoleName(overMaxName);
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// Test: Role Name Uniqueness Validation
// ============================================================================

describe('validateRoleNameUniqueness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate that unique name is available', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    const result = await validateRoleNameUniqueness('NewRole');
    expect(result.valid).toBe(true);
    expect(roleNameExists).toHaveBeenCalledWith('NewRole');
  });

  it('should reject duplicate role names', async () => {
    (roleNameExists as any).mockResolvedValue(true);
    const result = await validateRoleNameUniqueness('Engineering');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should handle case-insensitive duplicate check', async () => {
    (roleNameExists as any).mockResolvedValue(true);
    const result = await validateRoleNameUniqueness('engineering');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('case-insensitive');
  });

  it('should return error on database failure', async () => {
    (roleNameExists as any).mockRejectedValue(
      new Error('Database connection failed')
    );
    const result = await validateRoleNameUniqueness('TestRole');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Failed to validate');
  });
});

// ============================================================================
// Test: Role Description Validation
// ============================================================================

describe('validateRoleDescription', () => {
  it('should accept undefined description', () => {
    const result = validateRoleDescription(undefined);
    expect(result.valid).toBe(true);
  });

  it('should accept empty string description', () => {
    const result = validateRoleDescription('');
    expect(result.valid).toBe(true);
  });

  it('should accept valid description', () => {
    const result = validateRoleDescription('This is a valid description');
    expect(result.valid).toBe(true);
  });

  it('should accept description at maximum length boundary', () => {
    const maxDesc = 'A'.repeat(500);
    const result = validateRoleDescription(maxDesc);
    expect(result.valid).toBe(true);
  });

  it('should reject description exceeding maximum length', () => {
    const overMaxDesc = 'A'.repeat(501);
    const result = validateRoleDescription(overMaxDesc);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not exceed 500 characters');
  });

  it('should reject non-string descriptions', () => {
    const result = validateRoleDescription(123 as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be a string');
  });

  it('should accept special characters in description', () => {
    const result = validateRoleDescription('Role for @#$% users!');
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// Test: Create Custom Role
// ============================================================================

describe('createCustomRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a role with valid inputs', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    (dbCreateRole as any).mockResolvedValue(mockRole);

    const result = await createCustomRole(
      'Engineering',
      'Engineering team',
      'user-1'
    );

    expect(result).toEqual(mockRole);
    expect(dbCreateRole).toHaveBeenCalledWith(
      'Engineering',
      'Engineering team',
      'user-1'
    );
  });

  it('should create a role without description', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    (dbCreateRole as any).mockResolvedValue({
      ...mockRole,
      description: undefined,
    });

    const result = await createCustomRole('Sales', undefined, 'user-1');

    expect(result.description).toBeUndefined();
    expect(dbCreateRole).toHaveBeenCalled();
  });

  it('should reject invalid role name', async () => {
    const promise = createCustomRole('A', 'desc', 'user-1');
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should reject duplicate role names', async () => {
    // DB unique constraint handles duplicates now (no pre-check)
    (dbCreateRole as any).mockRejectedValue(new Error('A role with name "Engineering" already exists'));
    const promise = createCustomRole('Engineering', 'desc', 'user-1');
    await expect(promise).rejects.toThrow('already exists');
  });

  it('should reject invalid description', async () => {
    const overLongDesc = 'A'.repeat(501);
    const promise = createCustomRole('NewRole', overLongDesc, 'user-1');
    await expect(promise).rejects.toThrow('Invalid role description');
  });

  it('should accept null createdBy', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    (dbCreateRole as any).mockResolvedValue({ ...mockRole, createdBy: null });

    const result = await createCustomRole('NewRole', 'desc', null);
    expect(result.createdBy).toBeNull();
    expect(dbCreateRole).toHaveBeenCalledWith('NewRole', 'desc', null);
  });

  it('should trim whitespace from name before creation', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    (dbCreateRole as any).mockResolvedValue(mockRole);

    await createCustomRole('  Engineering  ', 'desc', 'user-1');

    expect(dbCreateRole).toHaveBeenCalledWith('Engineering', 'desc', 'user-1');
  });

  it('should handle database creation errors', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    (dbCreateRole as any).mockRejectedValue(new Error('Database error'));

    const promise = createCustomRole('NewRole', 'desc', 'user-1');
    await expect(promise).rejects.toThrow('Database error');
  });
});

// ============================================================================
// Test: Update Custom Role
// ============================================================================

describe('updateCustomRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update role name', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    (dbUpdateRole as any).mockResolvedValue(undefined);

    await updateCustomRole('role-1', { name: 'NewName' });

    expect(dbUpdateRole).toHaveBeenCalledWith('role-1', {
      name: 'NewName',
    });
  });

  it('should update role description', async () => {
    (dbUpdateRole as any).mockResolvedValue(undefined);

    await updateCustomRole('role-1', { description: 'New description' });

    expect(dbUpdateRole).toHaveBeenCalledWith('role-1', {
      description: 'New description',
    });
  });

  it('should update both name and description', async () => {
    (roleNameExists as any).mockResolvedValue(false);
    (dbUpdateRole as any).mockResolvedValue(undefined);

    await updateCustomRole('role-1', {
      name: 'NewName',
      description: 'New description',
    });

    expect(dbUpdateRole).toHaveBeenCalledWith('role-1', {
      name: 'NewName',
      description: 'New description',
    });
  });

  it('should reject invalid new name', async () => {
    const promise = updateCustomRole('role-1', { name: 'A' });
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should reject duplicate new name', async () => {
    (roleNameExists as any).mockResolvedValue(true);
    const promise = updateCustomRole('role-1', { name: 'ExistingName' });
    await expect(promise).rejects.toThrow('already exists');
  });

  it('should reject empty roleId', async () => {
    const promise = updateCustomRole('', { name: 'NewName' });
    await expect(promise).rejects.toThrow('roleId must be a non-empty string');
  });

  it('should reject invalid description in update', async () => {
    const overLongDesc = 'A'.repeat(501);
    const promise = updateCustomRole('role-1', { description: overLongDesc });
    await expect(promise).rejects.toThrow('Invalid role description');
  });

  it('should clear description if updated to empty string', async () => {
    (dbUpdateRole as any).mockResolvedValue(undefined);

    await updateCustomRole('role-1', { description: '' });

    expect(dbUpdateRole).toHaveBeenCalledWith('role-1', {
      description: '',
    });
  });
});

// ============================================================================
// Test: Delete Custom Role
// ============================================================================

describe('deleteCustomRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an unused role', async () => {
    (isRoleInUse as any).mockResolvedValue(false);
    (dbDeleteRole as any).mockResolvedValue(undefined);

    await deleteCustomRole('role-1');

    expect(isRoleInUse).toHaveBeenCalledWith('role-1');
    expect(dbDeleteRole).toHaveBeenCalledWith('role-1');
  });

  it('should reject deletion of role in use', async () => {
    (isRoleInUse as any).mockResolvedValue(true);

    const promise = deleteCustomRole('role-1');
    await expect(promise).rejects.toThrow(
      'Cannot delete this role because it is in use'
    );
    expect(dbDeleteRole).not.toHaveBeenCalled();
  });

  it('should reject empty roleId', async () => {
    const promise = deleteCustomRole('');
    await expect(promise).rejects.toThrow('roleId must be a non-empty string');
  });

  it('should handle database deletion errors', async () => {
    (isRoleInUse as any).mockResolvedValue(false);
    (dbDeleteRole as any).mockRejectedValue(new Error('Database error'));

    const promise = deleteCustomRole('role-1');
    await expect(promise).rejects.toThrow('Database error');
  });

  it('should provide meaningful error when role in use', async () => {
    (isRoleInUse as any).mockResolvedValue(true);

    const promise = deleteCustomRole('role-1');
    await expect(promise).rejects.toThrow(
      'Cannot delete this role because it is in use'
    );
  });
});

// ============================================================================
// Test: Seed Default Roles
// ============================================================================

describe('seedDefaultRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should seed default roles when collection is empty', async () => {
    (listRoles as any).mockResolvedValue([]);
    (dbCreateRole as any).mockResolvedValue(mockRole);

    const created = await seedDefaultRoles('system');

    expect(created).toBe(7); // 7 default roles
    expect(dbCreateRole).toHaveBeenCalledTimes(7);
  });

  it('should not seed if roles already exist', async () => {
    (listRoles as any).mockResolvedValue(mockRoles);

    const created = await seedDefaultRoles('system');

    expect(created).toBe(0);
    expect(dbCreateRole).not.toHaveBeenCalled();
  });

  it('should use custom userId for seeding', async () => {
    (listRoles as any).mockResolvedValue([]);
    (dbCreateRole as any).mockResolvedValue(mockRole);

    await seedDefaultRoles('custom-user');

    const calls = (dbCreateRole as any).mock.calls;
    calls.forEach((call: any[]) => {
      expect(call[2]).toBe('custom-user'); // createdBy is third parameter
    });
  });

  it('should default to null userId', async () => {
    (listRoles as any).mockResolvedValue([]);
    (dbCreateRole as any).mockResolvedValue(mockRole);

    await seedDefaultRoles();

    const calls = (dbCreateRole as any).mock.calls;
    calls.forEach((call: any[]) => {
      expect(call[2]).toBeNull();
    });
  });

  it('should seed all default roles with correct names', async () => {
    (listRoles as any).mockResolvedValue([]);
    (dbCreateRole as any).mockResolvedValue(mockRole);

    await seedDefaultRoles('system');

    const defaultRoles = [
      'Engineering',
      'Sales',
      'Product',
      'HR',
      'Operations',
      'Design',
      'Marketing',
    ];

    const calls = (dbCreateRole as any).mock.calls;
    const createdNames = calls.map((call: any[]) => call[0]);

    defaultRoles.forEach((role) => {
      expect(createdNames).toContain(role);
    });
  });

  it('should continue seeding if one role fails', async () => {
    (listRoles as any).mockResolvedValue([]);
    (dbCreateRole as any)
      .mockResolvedValueOnce(mockRole)
      .mockRejectedValueOnce(new Error('Failed to create Engineering'))
      .mockResolvedValue(mockRole);

    // Should not throw and should continue
    const created = await seedDefaultRoles('system');

    // 6 successful (skipping the failed one)
    expect(created).toBe(6);
  });

  it('should handle listRoles failure', async () => {
    (listRoles as any).mockRejectedValue(new Error('Database error'));

    const promise = seedDefaultRoles('system');
    await expect(promise).rejects.toThrow('Failed to seed default roles');
  });
});

// ============================================================================
// Test: Check Has Default Roles
// ============================================================================

describe('hasDefaultRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when roles exist', async () => {
    (listRoles as any).mockResolvedValue(mockRoles);

    const result = await hasDefaultRoles();

    expect(result).toBe(true);
  });

  it('should return false when no roles exist', async () => {
    (listRoles as any).mockResolvedValue([]);

    const result = await hasDefaultRoles();

    expect(result).toBe(false);
  });

  it('should handle database errors gracefully', async () => {
    (listRoles as any).mockRejectedValue(new Error('Database error'));

    const result = await hasDefaultRoles();

    expect(result).toBe(false); // Returns false on error instead of throwing
  });

  it('should log errors but not throw', async () => {
    (listRoles as any).mockRejectedValue(new Error('Test error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await hasDefaultRoles();

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
