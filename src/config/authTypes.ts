/**
 * Authentication Type Definitions
 * Defines all types related to user authentication and roles
 */

/**
 * User role types for role-based access control
 */
export type UserRole = 'employee' | 'manager' | 'admin';

/**
 * Represents an authenticated user with their role information
 */
export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
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
