/**
 * Core Type Definitions for OnboardingHub
 * These types mirror the Firestore schema structure
 */

// ============================================================================
// Role Management Constants
// ============================================================================

export const MIN_ROLE_NAME_LENGTH = 2;
export const MAX_ROLE_NAME_LENGTH = 50;
export const ROLE_NAME_PATTERN = /^[a-zA-Z0-9\s\-]+$/; // Alphanumeric, spaces, and hyphens only

/**
 * Represents a custom role that can be assigned to employees
 * Maps to Firestore 'roles' collection
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
 * Result of role name validation
 */
export interface RoleNameValidationResult {
  valid: boolean;
  error?: string; // Descriptive error message if invalid
}

/**
 * Represents a profile/department with associated role tags
 * Allows employees and managers to filter steps by profile
 * Maps to Firestore 'profiles' collection
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
 * Maps to Firestore 'users' collection
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
 * Result of user email validation
 */
export interface UserEmailValidationResult {
  valid: boolean;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Represents a single onboarding step/task
 * Maps to Firestore 'steps' collection documents
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
 * Maps to Firestore 'suggestions' collection
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
 * Props for reusable primitive components
 */
export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

export type BadgeColor = 'blue' | 'green' | 'red' | 'amber' | 'slate';

/**
 * Props for onboarding-specific components
 */
export interface StepCardProps {
  step: Step;
  index: number;
  onStatusChange: (id: number, newStatus: StepStatus) => void;
  onSuggestEdit: (stepId: number) => void;
  onReportStuck: (stepId: number) => void;
}

export interface WelcomeHeaderProps {
  employeeName: string;
  team: string;
  progress: number;
  profiles?: Profile[];
  selectedProfileId?: string;
  onProfileChange?: (profileId: string) => void;
}

export interface ActionBarProps {
  step: Step;
  onStatusChange: (id: number, newStatus: StepStatus) => void;
  onSuggestEdit: (stepId: number) => void;
  onReportStuck: (stepId: number) => void;
}

/**
 * Props for manager view components
 */
export interface KPICardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: React.ReactNode;
  color: 'success' | 'error' | 'warning';
}

export interface SuggestionCardProps {
  suggestion: Suggestion;
  stepTitle: string;
  onApprove: (id: number | string) => void;
  onReject: (id: number | string) => void;
}

export interface ActivityFeedProps {
  activities: Activity[];
}

/**
 * Activity log entry for manager view and audit trail
 */
export interface Activity {
  id: string;
  userInitials: string;
  action: string;
  timeAgo: string;
  timestamp?: number; // Unix timestamp for storage
  userId?: string; // ID of user who performed the action
  resourceType?: string; // Type of resource (template, instance, suggestion)
  resourceId?: string; // ID of the resource
}

/**
 * Represents an onboarding template (standard flow for a role)
 * Maps to Firestore 'templates' collection
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
 * Maps to Firestore 'onboarding_instances' collection
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
  startDate?: number; // Unix timestamp for employee's start date, optional
  completedAt?: number; // Unix timestamp when onboarding was completed
  progress: number; // 0-100 percentage
  status: 'active' | 'completed' | 'on_hold';
}

/**
 * Props for modal components
 */
export interface SuggestEditModalProps {
  step: Step;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  isSubmitting?: boolean;
}

export interface ReportStuckModalProps {
  step: Step;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * Main OnboardingHub state interface
 */
export interface OnboardingHubState {
  view: 'employee' | 'manager';
  steps: Step[];
  suggestions: Suggestion[];
  activeModal: ModalState | null;
  modalText: string;
}

/**
 * Props for NavBar component
 */
export interface NavBarProps {
  currentView: 'employee' | 'manager';
  onViewChange: (view: 'employee' | 'manager') => void;
}

/**
 * Props for ProgressBar component
 */
export interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

/**
 * Props for ModalWrapper component
 */
export interface ModalWrapperProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for manager view container components
 */
export interface ManagerDashboardHeaderProps {
  onNewHireClick?: () => void;
}

export interface KPISectionProps {
  steps: Step[];
  suggestions: Suggestion[];
  stuckEmployeeNames?: string[];
  profiles?: Profile[];
  selectedProfileId?: string;
  onProfileChange?: (profileId: string) => void;
}

export interface SuggestionsSectionProps {
  suggestions: Suggestion[];
  steps: Step[];
  onApprove?: (id: number | string) => void;
  onReject?: (id: number | string) => void;
}

export interface ActivitySectionProps {
  activities: Activity[];
}
