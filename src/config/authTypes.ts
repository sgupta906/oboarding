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
 * This type is derived from both Firebase Auth and Firestore user document
 */
export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
}

/**
 * Firestore user document structure
 * Stored at users/{uid}
 */
export interface FirestoreUser {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
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

/**
 * Sign-in request payload (for email link)
 */
export interface SignInRequest {
  email: string;
}

/**
 * Sign-in response
 */
export interface SignInResponse {
  success: boolean;
  message: string;
}
