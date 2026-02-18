/**
 * Role Management Constants
 */

export const MIN_ROLE_NAME_LENGTH = 2;
export const MAX_ROLE_NAME_LENGTH = 50;
export const ROLE_NAME_PATTERN = /^[a-zA-Z0-9 \-]+$/; // Alphanumeric, regular spaces, and hyphens only

/**
 * Result of role name validation
 */
export interface RoleNameValidationResult {
  valid: boolean;
  error?: string; // Descriptive error message if invalid
}
