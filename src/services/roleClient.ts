/**
 * Role Management Service
 * Handles role validation, creation, updates, and initialization
 * Implements strict validation following security-first principles
 */

import {
  listRoles,
  getRole,
  createRole as firestoreCreateRole,
  updateRole as firestoreUpdateRole,
  deleteRole as firestoreDeleteRole,
  roleNameExists,
  isRoleInUse,
} from './dataClient';
import {
  CustomRole,
  RoleNameValidationResult,
  MIN_ROLE_NAME_LENGTH,
  MAX_ROLE_NAME_LENGTH,
  ROLE_NAME_PATTERN,
} from '../types';

// ============================================================================
// Default Roles
// ============================================================================

const DEFAULT_ROLES = [
  'Engineering',
  'Sales',
  'Product',
  'HR',
  'Operations',
  'Design',
  'Marketing',
];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates role name according to strict rules
 * Rules:
 * - Length: 2-50 characters
 * - Characters: Alphanumeric, spaces, and hyphens only
 * - No leading/trailing whitespace
 * - At least one alphanumeric character
 *
 * Security: Ensures role names are safe for display and queries
 *
 * @param name - Role name to validate
 * @returns Validation result with error message if invalid
 */
export function validateRoleName(name: string): RoleNameValidationResult {
  // Check for null/undefined
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'Role name must be a non-empty string',
    };
  }

  // Check that it's not only whitespace (before trimming for better error message)
  if (/^\s+$/.test(name)) {
    return {
      valid: false,
      error: 'Role name cannot be only whitespace',
    };
  }

  const trimmed = name.trim();

  // Check minimum length
  if (trimmed.length < MIN_ROLE_NAME_LENGTH) {
    return {
      valid: false,
      error: `Role name must be at least ${MIN_ROLE_NAME_LENGTH} characters`,
    };
  }

  // Check maximum length
  if (trimmed.length > MAX_ROLE_NAME_LENGTH) {
    return {
      valid: false,
      error: `Role name must not exceed ${MAX_ROLE_NAME_LENGTH} characters`,
    };
  }

  // Check pattern (alphanumeric, spaces, hyphens only)
  if (!ROLE_NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error:
        'Role name can only contain letters, numbers, spaces, and hyphens',
    };
  }

  return { valid: true };
}

/**
 * Validates role name for uniqueness (case-insensitive)
 * Security: Prevents duplicate roles in the system
 *
 * @param name - Role name to check
 * @returns Validation result with error if name already exists
 */
export async function validateRoleNameUniqueness(
  name: string
): Promise<RoleNameValidationResult> {
  try {
    const exists = await roleNameExists(name);
    if (exists) {
      return {
        valid: false,
        error: `A role with name "${name}" already exists (case-insensitive)`,
      };
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate role name uniqueness: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validates optional description field
 * Rules:
 * - Maximum 500 characters
 * - No validation of content (can be any characters)
 *
 * @param description - Description to validate
 * @returns Validation result with error if invalid
 */
export function validateRoleDescription(
  description: string | undefined
): RoleNameValidationResult {
  if (!description) {
    return { valid: true };
  }

  if (typeof description !== 'string') {
    return {
      valid: false,
      error: 'Role description must be a string',
    };
  }

  const maxLength = 500;
  if (description.length > maxLength) {
    return {
      valid: false,
      error: `Role description must not exceed ${maxLength} characters`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Role CRUD Operations with Validation
// ============================================================================

/**
 * Creates a new custom role with full validation
 * Security:
 * - Validates all inputs
 * - Checks for duplicate names (case-insensitive)
 * - Prevents injection attacks via validation patterns
 *
 * @param name - Role name (required, unique)
 * @param description - Optional role description
 * @param createdBy - User ID who is creating the role
 * @returns Promise resolving to created CustomRole
 * @throws Error with descriptive message if validation fails
 */
export async function createCustomRole(
  name: string,
  description: string | undefined,
  createdBy: string
): Promise<CustomRole> {
  // Validate name
  const nameValidation = validateRoleName(name);
  if (!nameValidation.valid) {
    throw new Error(`Invalid role name: ${nameValidation.error}`);
  }

  // Check for duplicates
  const uniquenessCheck = await validateRoleNameUniqueness(name);
  if (!uniquenessCheck.valid) {
    throw new Error(`Role name not unique: ${uniquenessCheck.error}`);
  }

  // Validate description if provided
  const descValidation = validateRoleDescription(description);
  if (!descValidation.valid) {
    throw new Error(`Invalid role description: ${descValidation.error}`);
  }

  // Validate createdBy
  if (!createdBy || typeof createdBy !== 'string' || createdBy.trim().length === 0) {
    throw new Error('createdBy must be a non-empty string');
  }

  // All validation passed, create the role
  return firestoreCreateRole(name.trim(), description, createdBy);
}

/**
 * Updates an existing custom role with validation
 * Security:
 * - Validates all inputs
 * - Prevents updating immutable fields (id, createdAt, createdBy)
 * - Checks for duplicate names when updating name
 *
 * @param roleId - Role document ID
 * @param updates - Fields to update (name and/or description)
 * @returns Promise resolving when update is complete
 * @throws Error with descriptive message if validation fails
 */
export async function updateCustomRole(
  roleId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new Error('roleId must be a non-empty string');
  }

  // Validate new name if provided
  if (updates.name !== undefined) {
    const nameValidation = validateRoleName(updates.name);
    if (!nameValidation.valid) {
      throw new Error(`Invalid role name: ${nameValidation.error}`);
    }

    // Check for duplicates (excluding current role)
    const currentRole = await getRole(roleId);
    const trimmedNewName = updates.name.trim().toLowerCase();
    const trimmedCurrentName = currentRole?.name.trim().toLowerCase();

    // Only check for duplicates if the name is actually changing
    if (trimmedNewName !== trimmedCurrentName) {
      const exists = await roleNameExists(updates.name);
      if (exists) {
        throw new Error(
          `A role with name "${updates.name}" already exists (case-insensitive)`
        );
      }
    }
  }

  // Validate new description if provided
  if (updates.description !== undefined) {
    const descValidation = validateRoleDescription(updates.description);
    if (!descValidation.valid) {
      throw new Error(`Invalid role description: ${descValidation.error}`);
    }
  }

  return firestoreUpdateRole(roleId, updates);
}

/**
 * Deletes a custom role with safety checks
 * Security:
 * - Checks if role is in use before deletion
 * - Returns meaningful error if role cannot be deleted
 *
 * @param roleId - Role document ID
 * @returns Promise resolving when deletion is complete
 * @throws Error if role is in use or doesn't exist
 */
export async function deleteCustomRole(roleId: string): Promise<void> {
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new Error('roleId must be a non-empty string');
  }

  const inUse = await isRoleInUse(roleId);
  if (inUse) {
    throw new Error(
      'Cannot delete this role because it is in use by one or more templates or onboarding instances. Please update or remove those references first.'
    );
  }

  return firestoreDeleteRole(roleId);
}

// ============================================================================
// Initialization & Seeding
// ============================================================================

/**
 * Seeds default roles if the roles collection is empty
 * Should be called once during app initialization
 * Security:
 * - Only seeds if collection is empty (prevents overwriting)
 * - Uses system-level initialization (createdBy: 'system')
 * - Idempotent: safe to call multiple times
 *
 * @param userId - User ID for createdBy field (defaults to 'system')
 * @returns Promise resolving to number of roles created
 */
export async function seedDefaultRoles(userId: string = 'system'): Promise<number> {
  try {
    const existingRoles = await listRoles();

    // Only seed if collection is empty
    if (existingRoles.length > 0) {
      return 0;
    }

    let created = 0;

    for (const roleName of DEFAULT_ROLES) {
      try {
        await firestoreCreateRole(roleName, undefined, userId);
        created++;
      } catch (error) {
        // Log but continue with other roles
        console.error(
          `Failed to seed role "${roleName}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return created;
  } catch (error) {
    throw new Error(
      `Failed to seed default roles: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Checks if default roles have been initialized
 * @returns Promise resolving to true if roles exist, false otherwise
 */
export async function hasDefaultRoles(): Promise<boolean> {
  try {
    const roles = await listRoles();
    return roles.length > 0;
  } catch (error) {
    console.error(
      `Failed to check if default roles exist: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}
