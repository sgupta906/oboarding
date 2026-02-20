/**
 * Domain Model Types for OnboardingHub
 * These types mirror the Supabase database schema
 */

/**
 * Represents a custom role that can be assigned to employees
 * Maps to Supabase 'roles' table
 */
export interface CustomRole {
  id: string;
  name: string; // Required, unique, case-insensitive
  description?: string; // Optional detailed description
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  createdBy: string; // User ID who created the role
}

/**
 * Represents a profile/department with associated role tags
 * Allows employees and managers to filter steps by profile
 * Maps to Supabase 'profiles' table
 */
export interface Profile {
  id: string;
  name: string; // Profile name (e.g., 'Engineer', 'Intern', 'Sales', 'Product')
  description?: string; // Optional description of the profile
  roleTags: string[]; // Array of role tags this profile includes (e.g., ['Engineering', 'All'])
  createdAt: number; // Unix timestamp
  createdBy: string; // User ID who created the profile
}

// ============================================================================
// User Management Types
// ============================================================================

/**
 * Represents a system user (employee/manager/admin)
 * Maps to Supabase 'users' table
 */
export interface User {
  id: string;
  email: string; // Required, unique, case-insensitive
  name: string; // User's full name
  roles: string[]; // Array of role IDs or names (e.g., ['manager', 'admin'])
  profiles?: string[]; // Optional profile assignments (e.g., ['Engineering', 'Sales'])
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  createdBy: string; // User ID who created this user
}

/**
 * Form data for creating/editing users
 */
export interface UserFormData {
  email: string;
  name: string;
  roles: string[];
  profiles?: string[];
}

/**
 * Represents a single onboarding step/task
 */
export interface Step {
  id: number;
  title: string;
  description: string;
  role: string; // 'All', 'Engineering', 'Sales', etc.
  owner: string; // Department or team responsible (e.g., 'IT Support', 'DevOps')
  expert: string; // Subject Matter Expert name
  status: StepStatus;
  link: string; // Reference link for the step
}

/**
 * Step status states in the onboarding journey
 */
export type StepStatus = 'pending' | 'completed' | 'stuck';

/**
 * Represents a suggestion or feedback on a step
 * Maps to Supabase 'suggestions' table
 */
export interface Suggestion {
  id: number | string;
  stepId: number;
  user: string; // Name of the user who submitted the suggestion
  text: string; // The suggestion content
  status: SuggestionStatus;
  createdAt?: number; // Unix timestamp
  instanceId?: string; // Reference to the onboarding instance
}

/**
 * Suggestion status states
 */
export type SuggestionStatus = 'pending' | 'reviewed' | 'implemented';

/**
 * Modal state for handling edit/stuck modals
 */
export interface ModalState {
  type: 'edit' | 'stuck';
  stepId: number;
}

/**
 * Activity log entry for manager view and audit trail
 */
export interface Activity {
  id: string;
  userInitials: string;
  userName?: string; // Full display name, optional for backward compat with old rows
  action: string;
  timeAgo: string;
  timestamp?: number; // Unix timestamp for storage
  userId?: string; // ID of user who performed the action
  resourceType?: string; // Type of resource (template, instance, suggestion)
  resourceId?: string; // ID of the resource
}

/**
 * Represents an onboarding template (standard flow for a role)
 * Maps to Supabase 'templates' table
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  role: string; // 'Engineering', 'Sales', 'HR', etc.
  steps: Step[];
  createdAt: number; // Unix timestamp
  updatedAt?: number;
  isActive: boolean;
}

/**
 * Represents a single instance of onboarding for an employee
 * Maps to Supabase 'onboarding_instances' table
 */
export interface OnboardingInstance {
  id: string;
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  templateId: string;
  steps: Step[];
  createdAt: number; // Unix timestamp
  updatedAt?: number; // Unix timestamp, set by DB trigger on every update
  startDate?: number; // Unix timestamp for employee's start date, optional
  completedAt?: number; // Unix timestamp when onboarding was completed
  progress: number; // 0-100 percentage
  status: 'active' | 'completed' | 'on_hold';
  // Profile-template support (optional for backward compatibility)
  profileIds?: string[]; // Array of profile IDs assigned to this onboarding run
  templateIds?: string[]; // Array of profile template IDs used (for audit trail)
  templateSnapshots?: {
    // Map of template snapshots captured at instantiation time
    [templateId: string]: {
      profileId: string;
      steps: Step[];
      templateName: string;
      capturedAt: number;
    };
  };
}
