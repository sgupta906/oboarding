/**
 * Authentication Type Definitions
 * Defines all types related to user authentication and roles
 */

/**
 * User role types for role-based access control.
 * Broadened to string to support custom roles from the roles table
 * (e.g., "team-lead", "hr-admin", etc.)
 */
export type UserRole = string;

/**
 * Check if a role has manager-level access (any non-employee role).
 * Used for view routing, NavBar visibility, and template access.
 */
export function hasManagerAccess(role: UserRole | null): boolean {
  return role != null && role !== 'employee';
}

/**
 * Represents an authenticated user with their role information
 */
export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole | null;
}

/**
 * Auth context value type
 */
export interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}
