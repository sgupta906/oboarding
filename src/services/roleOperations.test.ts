/**
 * Extended Role Operations Test Suite for OnboardingHub
 * Comprehensive tests for all role CRUD operations
 * Tests validation, error handling, localStorage fallback, and edge cases
 *
 * Note: roleClient.test.ts already exists with comprehensive tests
 * This file extends with additional integration tests and edge cases
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  validateRoleName,
  validateRoleDescription,
  seedDefaultRoles,
  hasDefaultRoles,
} from './roleClient';
import type { CustomRole } from '../types';

// Storage key for localStorage-backed mock
const ROLES_KEY = 'onboardinghub_roles';

// Mock supabase service with localStorage-backed implementations
// This preserves the integration test semantics from the old Firebase/localStorage era
vi.mock('./supabase', () => {
  const getRoles = (): CustomRole[] => {
    try { return JSON.parse(localStorage.getItem(ROLES_KEY) || '[]'); } catch { return []; }
  };
  const saveRoles = (roles: CustomRole[]) => {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  };

  return {
    listRoles: vi.fn(async () => getRoles()),
    getRole: vi.fn(async (id: string) => getRoles().find(r => r.id === id) ?? null),
    roleNameExists: vi.fn(async (name: string) =>
      getRoles().some(r => r.name.toLowerCase() === name.toLowerCase().trim())
    ),
    isRoleInUse: vi.fn(async () => false),
    createRole: vi.fn(async (name: string, description: string | undefined, createdBy: string) => {
      const now = Date.now();
      const role: CustomRole = {
        id: `role-${now}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        description: description !== undefined ? description : undefined,
        createdAt: now,
        updatedAt: now,
        createdBy,
      };
      const roles = getRoles();
      roles.push(role);
      saveRoles(roles);
      return role;
    }),
    updateRole: vi.fn(async (roleId: string, updates: { name?: string; description?: string }) => {
      const roles = getRoles();
      const idx = roles.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        if (updates.name) roles[idx].name = updates.name.trim();
        if (updates.description !== undefined) roles[idx].description = updates.description;
        roles[idx].updatedAt = Date.now();
        saveRoles(roles);
      }
    }),
    deleteRole: vi.fn(async (roleId: string) => {
      const roles = getRoles().filter(r => r.id !== roleId);
      saveRoles(roles);
    }),
    subscribeToRoles: vi.fn(),
  };
});

import { listRoles } from './supabase';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockRole1Data = {
  name: 'QA-Engineer',
  description: 'QA team members',
  createdBy: 'admin-1',
};

const mockRole2Data = {
  name: 'Tech-Lead',
  description: 'Technical leadership team',
  createdBy: 'admin-1',
};

const mockRole3Data = {
  name: 'Contract-Specialist',
  description: 'Contract specialist with negotiation skills',
  createdBy: 'admin-2',
};

// ============================================================================
// Test: Create Role - Comprehensive Integration
// ============================================================================

describe('createCustomRole - Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create role with valid inputs', async () => {
    const role = await createCustomRole(
      mockRole1Data.name,
      mockRole1Data.description,
      mockRole1Data.createdBy
    );

    expect(role).toBeDefined();
    expect(role.name).toBe(mockRole1Data.name);
    expect(role.description).toBe(mockRole1Data.description);
    expect(role.createdBy).toBe(mockRole1Data.createdBy);
    expect(role.id).toBeDefined();
    expect(role.createdAt).toBeDefined();
    expect(role.updatedAt).toBeDefined();
  });

  it('should create role without description', async () => {
    const role = await createCustomRole(
      mockRole1Data.name,
      undefined,
      mockRole1Data.createdBy
    );

    expect(role.description).toBeUndefined();
  });

  it('should create role with empty description', async () => {
    const role = await createCustomRole(
      mockRole1Data.name,
      '',
      mockRole1Data.createdBy
    );

    expect(role.description).toBe('');
  });

  it('should reject role names shorter than 2 characters', async () => {
    const promise = createCustomRole('A', 'description', 'admin-1');
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should reject role names longer than 50 characters', async () => {
    const longName = 'A'.repeat(51);
    const promise = createCustomRole(longName, 'description', 'admin-1');
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should accept role names at minimum boundary (2 chars)', async () => {
    const role = await createCustomRole('AB', 'description', 'admin-1');
    expect(role.name).toBe('AB');
  });

  it('should accept role names at maximum boundary (50 chars)', async () => {
    const maxName = 'A'.repeat(50);
    const role = await createCustomRole(maxName, 'description', 'admin-1');
    expect(role.name).toBe(maxName);
  });

  it('should trim whitespace from role name', async () => {
    const role = await createCustomRole(
      '  QA-Team  ',
      'description',
      'admin-1'
    );

    expect(role.name).toBe('QA-Team');
  });

  it('should reject names with only whitespace', async () => {
    const promise = createCustomRole('   ', 'description', 'admin-1');
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should reject names with special characters', async () => {
    const promise = createCustomRole(
      'Engineer@Manager',
      'description',
      'admin-1'
    );
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should reject names with underscores', async () => {
    const promise = createCustomRole(
      'Engineer_Manager',
      'description',
      'admin-1'
    );
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should reject names with dots', async () => {
    const promise = createCustomRole('Engineer.Manager', 'description', 'admin-1');
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should accept names with hyphens', async () => {
    const role = await createCustomRole(
      'Senior-Engineer',
      'description',
      'admin-1'
    );
    expect(role.name).toBe('Senior-Engineer');
  });

  it('should accept names with spaces', async () => {
    const role = await createCustomRole(
      'Product Manager',
      'description',
      'admin-1'
    );
    expect(role.name).toBe('Product Manager');
  });

  it('should accept names with numbers', async () => {
    const role = await createCustomRole(
      'Level3 Manager',
      'description',
      'admin-1'
    );
    expect(role.name).toBe('Level3 Manager');
  });

  it('should reject duplicate role names (case-insensitive)', async () => {
    await createCustomRole(
      mockRole1Data.name,
      'description',
      'admin-1'
    );

    const promise = createCustomRole(
      mockRole1Data.name.toUpperCase(),
      'description',
      'admin-1'
    );

    await expect(promise).rejects.toThrow('already exists');
  });

  it('should reject duplicate role names with mixed case', async () => {
    await createCustomRole(
      'Engineering-Team',
      'description',
      'admin-1'
    );

    const promise = createCustomRole(
      'ENGINEERING-TEAM', // different case
      'description',
      'admin-1'
    );

    await expect(promise).rejects.toThrow('already exists');
  });

  it('should reject description exceeding 500 characters', async () => {
    const longDesc = 'A'.repeat(501);
    const promise = createCustomRole(
      mockRole1Data.name,
      longDesc,
      'admin-1'
    );

    await expect(promise).rejects.toThrow('Invalid role description');
  });

  it('should accept description at 500 character boundary', async () => {
    const maxDesc = 'A'.repeat(500);
    const role = await createCustomRole(
      mockRole1Data.name,
      maxDesc,
      'admin-1'
    );

    expect(role.description?.length).toBe(500);
  });

  it('should accept special characters in description', async () => {
    const desc = 'Role for @#$% users! With special chars & symbols!';
    const role = await createCustomRole(
      mockRole1Data.name,
      desc,
      'admin-1'
    );

    expect(role.description).toBe(desc);
  });

  it('should reject empty createdBy', async () => {
    const promise = createCustomRole(mockRole1Data.name, 'description', '');
    await expect(promise).rejects.toThrow('createdBy must be a non-empty string');
  });

  it('should reject null createdBy', async () => {
    const promise = createCustomRole(
      mockRole1Data.name,
      'description',
      null as any
    );
    await expect(promise).rejects.toThrow('createdBy must be a non-empty string');
  });

  it('should reject whitespace-only createdBy', async () => {
    const promise = createCustomRole(
      mockRole1Data.name,
      'description',
      '   '
    );
    await expect(promise).rejects.toThrow('createdBy must be a non-empty string');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = Date.now();
    const role = await createCustomRole(
      mockRole1Data.name,
      'description',
      'admin-1'
    );
    const afterCreate = Date.now();

    expect(role.createdAt).toBeGreaterThanOrEqual(beforeCreate);
    expect(role.createdAt).toBeLessThanOrEqual(afterCreate);
    expect(role.updatedAt).toBe(role.createdAt);
  });

  it('should generate unique role IDs', async () => {
    const role1 = await createCustomRole(
      mockRole1Data.name,
      'description',
      'admin-1'
    );
    const role2 = await createCustomRole(
      mockRole2Data.name,
      'description',
      'admin-1'
    );

    expect(role1.id).not.toBe(role2.id);
  });

  it('should persist role to localStorage', async () => {
    const role = await createCustomRole(
      mockRole1Data.name,
      'description',
      'admin-1'
    );

    const roles = JSON.parse(
      localStorage.getItem('onboardinghub_roles') || '[]'
    );
    const found = roles.find((r: CustomRole) => r.id === role.id);

    expect(found).toBeDefined();
  });
});

// ============================================================================
// Test: Update Role - Comprehensive Integration
// ============================================================================

describe('updateCustomRole - Integration Tests', () => {
  let roleId: string;

  beforeEach(async () => {
    localStorage.clear();
    const role = await createCustomRole(
      mockRole1Data.name,
      mockRole1Data.description,
      'admin-1'
    );
    roleId = role.id;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should update role description', async () => {
    const newDesc = 'Updated description for engineering team';
    await updateCustomRole(roleId, { description: newDesc });

    const roles = await listRoles();
    const updated = roles.find((r) => r.id === roleId);

    expect(updated?.description).toBe(newDesc);
  });

  it('should clear description by updating to empty string', async () => {
    await updateCustomRole(roleId, { description: '' });

    const roles = await listRoles();
    const updated = roles.find((r) => r.id === roleId);

    expect(updated?.description).toBe('');
  });

  it('should accept description at 500 character limit', async () => {
    const maxDesc = 'A'.repeat(500);
    await updateCustomRole(roleId, { description: maxDesc });

    const roles = await listRoles();
    const updated = roles.find((r) => r.id === roleId);

    expect(updated?.description?.length).toBe(500);
  });

  it('should reject description exceeding 500 characters', async () => {
    const longDesc = 'A'.repeat(501);
    const promise = updateCustomRole(roleId, { description: longDesc });

    await expect(promise).rejects.toThrow('Invalid role description');
  });

  it('should update role name', async () => {
    const newName = 'Backend Engineering';
    await updateCustomRole(roleId, { name: newName });

    const roles = await listRoles();
    const updated = roles.find((r) => r.id === roleId);

    expect(updated?.name).toBe(newName);
  });

  it('should accept name updates at boundaries', async () => {
    const newName = 'AB'; // Minimum
    await updateCustomRole(roleId, { name: newName });

    const roles = await listRoles();
    const updated = roles.find((r) => r.id === roleId);

    expect(updated?.name).toBe(newName);
  });

  it('should update both name and description at once', async () => {
    const newName = 'Eng-Team';
    const newDesc = 'New description';

    await updateCustomRole(roleId, {
      name: newName,
      description: newDesc,
    });

    const roles = await listRoles();
    const updated = roles.find((r) => r.id === roleId);

    expect(updated?.name).toBe(newName);
    expect(updated?.description).toBe(newDesc);
  });

  it('should reject invalid name updates', async () => {
    const promise = updateCustomRole(roleId, { name: 'A' }); // Too short
    await expect(promise).rejects.toThrow('Invalid role name');
  });

  it('should reject duplicate name updates', async () => {
    // Create another role
    await createCustomRole(mockRole2Data.name, 'description', 'admin-1');

    // Try to update first role to match second role's name
    const promise = updateCustomRole(roleId, {
      name: mockRole2Data.name,
    });

    await expect(promise).rejects.toThrow('already exists');
  });

  it('should reject empty roleId', async () => {
    const promise = updateCustomRole('', { description: 'new' });
    await expect(promise).rejects.toThrow('roleId must be a non-empty string');
  });

  it('should reject null roleId', async () => {
    const promise = updateCustomRole(null as any, { description: 'new' });
    await expect(promise).rejects.toThrow('roleId must be a non-empty string');
  });

  it('should update timestamp on modification', async () => {
    const rolesBefore = await listRoles();
    const original = rolesBefore.find((r) => r.id === roleId);
    const originalUpdatedAt = original?.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    await updateCustomRole(roleId, { description: 'Updated' });

    const rolesAfter = await listRoles();
    const updated = rolesAfter.find((r) => r.id === roleId);

    expect(updated?.updatedAt).toBeGreaterThan(originalUpdatedAt!);
  });

  it('should not modify createdAt timestamp', async () => {
    const rolesBefore = await listRoles();
    const original = rolesBefore.find((r) => r.id === roleId);
    const originalCreatedAt = original?.createdAt;

    await updateCustomRole(roleId, { description: 'Updated' });

    const rolesAfter = await listRoles();
    const updated = rolesAfter.find((r) => r.id === roleId);

    expect(updated?.createdAt).toBe(originalCreatedAt);
  });

  it('should not modify createdBy field', async () => {
    const rolesBefore = await listRoles();
    const original = rolesBefore.find((r) => r.id === roleId);

    await updateCustomRole(roleId, { description: 'Updated' });

    const rolesAfter = await listRoles();
    const updated = rolesAfter.find((r) => r.id === roleId);

    expect(updated?.createdBy).toBe(original?.createdBy);
  });

  it('should handle no-op updates gracefully', async () => {
    const rolesBefore = await listRoles();
    const original = rolesBefore.find((r) => r.id === roleId);

    // Update with same values
    await updateCustomRole(roleId, {
      name: original?.name,
      description: original?.description,
    });

    const rolesAfter = await listRoles();
    const updated = rolesAfter.find((r) => r.id === roleId);

    expect(updated).toEqual(original);
  });
});

// ============================================================================
// Test: Delete Role - Comprehensive Integration
// ============================================================================

describe('deleteCustomRole - Integration Tests', () => {
  let roleId: string;

  beforeEach(async () => {
    localStorage.clear();
    const role = await createCustomRole(
      mockRole1Data.name,
      mockRole1Data.description,
      'admin-1'
    );
    roleId = role.id;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should delete an unused role', async () => {
    // In development mode with localStorage, isRoleInUse always returns false
    await deleteCustomRole(roleId);

    const roles = await listRoles();
    const deleted = roles.find((r) => r.id === roleId);

    expect(deleted).toBeUndefined();
  });

  it('should reject deletion of role with empty ID', async () => {
    const promise = deleteCustomRole('');
    await expect(promise).rejects.toThrow('roleId must be a non-empty string');
  });

  it('should reject deletion of role with null ID', async () => {
    const promise = deleteCustomRole(null as any);
    await expect(promise).rejects.toThrow('roleId must be a non-empty string');
  });

  it('should preserve other roles when deleting one', async () => {
    const role2 = await createCustomRole(
      mockRole2Data.name,
      'description',
      'admin-1'
    );
    const role3 = await createCustomRole(
      mockRole3Data.name,
      'description',
      'admin-1'
    );

    await deleteCustomRole(roleId);

    const roles = await listRoles();
    expect(roles.some((r) => r.id === roleId)).toBe(false);
    expect(roles.some((r) => r.id === role2.id)).toBe(true);
    expect(roles.some((r) => r.id === role3.id)).toBe(true);
  });
});

// ============================================================================
// Test: Seed Default Roles - Integration
// ============================================================================

describe('seedDefaultRoles - Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should seed exactly 7 default roles', async () => {
    const created = await seedDefaultRoles('system');
    expect(created).toBe(7);
  });

  it('should seed specific default roles', async () => {
    await seedDefaultRoles('system');

    const roles = await listRoles();
    const roleNames = roles.map((r) => r.name);

    const expectedRoles = [
      'Engineering',
      'Sales',
      'Product',
      'HR',
      'Operations',
      'Design',
      'Marketing',
    ];

    expectedRoles.forEach((roleName) => {
      expect(roleNames).toContain(roleName);
    });
  });

  it('should not re-seed if roles already exist', async () => {
    await seedDefaultRoles('system');

    const secondSeed = await seedDefaultRoles('system');

    expect(secondSeed).toBe(0); // No roles created on second seed
  });

  it('should use provided userId as createdBy', async () => {
    await seedDefaultRoles('custom-admin');

    const roles = await listRoles();
    roles.forEach((role) => {
      expect(role.createdBy).toBe('custom-admin');
    });
  });

  it('should default to system userId', async () => {
    await seedDefaultRoles();

    const roles = await listRoles();
    roles.forEach((role) => {
      expect(role.createdBy).toBe('system');
    });
  });

  it('should create roles with proper timestamps', async () => {
    const beforeSeed = Date.now();
    await seedDefaultRoles('system');
    const afterSeed = Date.now();

    const roles = await listRoles();
    roles.forEach((role) => {
      expect(role.createdAt).toBeGreaterThanOrEqual(beforeSeed);
      expect(role.createdAt).toBeLessThanOrEqual(afterSeed);
    });
  });
});

// ============================================================================
// Test: Has Default Roles - Integration
// ============================================================================

describe('hasDefaultRoles - Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return false when no roles exist', async () => {
    const hasRoles = await hasDefaultRoles();
    expect(hasRoles).toBe(false);
  });

  it('should return true after seeding roles', async () => {
    await seedDefaultRoles('system');

    const hasRoles = await hasDefaultRoles();
    expect(hasRoles).toBe(true);
  });

  it('should return true when any role exists', async () => {
    await createCustomRole('TestRole', 'description', 'admin-1');

    const hasRoles = await hasDefaultRoles();
    expect(hasRoles).toBe(true);
  });

  it('should return false after deleting all roles', async () => {
    await seedDefaultRoles('system');

    const roles = await listRoles();
    for (const role of roles) {
      await deleteCustomRole(role.id);
    }

    const hasRoles = await hasDefaultRoles();
    expect(hasRoles).toBe(false);
  });
});

// ============================================================================
// Test: Role Name Validation Edge Cases
// ============================================================================

describe('validateRoleName - Edge Cases', () => {
  it('should handle role names with consecutive spaces', () => {
    const result = validateRoleName('Engineering    Manager');
    expect(result.valid).toBe(true);
  });

  it('should handle role names with consecutive hyphens', () => {
    const result = validateRoleName('Senior--Manager');
    expect(result.valid).toBe(true);
  });

  it('should handle mixed alphanumeric and hyphens', () => {
    const result = validateRoleName('L3-Engineer-Team');
    expect(result.valid).toBe(true);
  });

  it('should trim before validating length', () => {
    const result = validateRoleName('  ' + 'A'.repeat(50) + '  ');
    expect(result.valid).toBe(true);
  });

  it('should reject names with tabs', () => {
    const result = validateRoleName('Engineer\tManager');
    expect(result.valid).toBe(false);
  });

  it('should reject names with newlines', () => {
    const result = validateRoleName('Engineer\nManager');
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// Test: Role Description Validation Edge Cases
// ============================================================================

describe('validateRoleDescription - Edge Cases', () => {
  it('should accept descriptions with newlines', () => {
    const desc = 'This is a role\nfor engineering teams';
    const result = validateRoleDescription(desc);
    expect(result.valid).toBe(true);
  });

  it('should accept descriptions with tabs', () => {
    const desc = 'Role\tfor\tEngineering';
    const result = validateRoleDescription(desc);
    expect(result.valid).toBe(true);
  });

  it('should accept descriptions with unicode characters', () => {
    const desc = 'Role für Engineering team';
    const result = validateRoleDescription(desc);
    expect(result.valid).toBe(true);
  });

  it('should accept descriptions with emoji', () => {
    const desc = 'Engineering Team 🚀';
    const result = validateRoleDescription(desc);
    expect(result.valid).toBe(true);
  });

  it('should handle exactly 500 character description', () => {
    const desc = 'A'.repeat(500);
    const result = validateRoleDescription(desc);
    expect(result.valid).toBe(true);
  });
});
