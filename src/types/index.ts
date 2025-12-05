/**
 * Core Type Definitions for OnboardingHub
 * These types mirror the Firestore schema structure
 */

// ============================================================================
// Role Management Constants
// ============================================================================

export const MIN_ROLE_NAME_LENGTH = 2;
export const MAX_ROLE_NAME_LENGTH = 50;
export const ROLE_NAME_PATTERN = /^[a-zA-Z0-9 \-]+$/; // Alphanumeric, regular spaces, and hyphens only

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

/**
 * Represents a profile-specific onboarding template
 * Contains shared step lists that can be assigned to multiple profiles
 * Maps to Firestore 'profileTemplates' collection
 */
export interface ProfileTemplate {
  id: string;
  profileId: string; // Reference to parent profile ID
  name: string; // Template name (e.g., "Engineer Standard Onboarding")
  description?: string; // Optional template description
  steps: Step[]; // Array of Step objects for this profile
  createdAt: number; // Unix timestamp
  updatedAt?: number; // Last modified timestamp
  createdBy: string; // User ID who created the template
  version: number; // Version counter for schema migrations
  isPublished: boolean; // Draft vs live template gate
}

/**
 * Result of profile template validation
 */
export interface ProfileTemplateValidationResult {
  valid: boolean;
  error?: string; // Descriptive error message if invalid
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
 *
 * CRITICAL ARCHITECTURE NOTES:
 *
 * 1. STEPS ARE COPIED AT CREATION TIME
 *    - When an instance is created, steps are copied from the template (not live-linked)
 *    - Employee's steps remain unchanged even if the template is later edited
 *    - This preserves progress and creates an audit trail
 *
 * 2. WHAT DETERMINES WHICH STEPS AN EMPLOYEE SEES?
 *    - The templateId and steps array, set at instance creation time
 *    - NOT determined by role (role is system access control, not content)
 *    - NOT determined by profile (profile is content organization, not assignment)
 *    - Only the explicit template selection in createOnboardingRunFromTemplate() matters
 *
 * 3. NO TEMPLATE SWITCHING CURRENTLY
 *    - Once created with templateId "X", the instance always uses steps from "X"
 *    - There is no "switch to template Y" function
 *    - New steps can be added via syncTemplateStepsToInstances() (additive only)
 *
 * 4. FUTURE MULTI-PROFILE SUPPORT (MILESTONE 4+)
 *    - profileIds[], templateIds[], and templateSnapshots enable multiple templates
 *    - When implemented, createOnboardingRunFromTemplate() will:
 *      a) Accept profileIds[] instead of templateId
 *      b) Fetch all profile templates
 *      c) Merge and deduplicate steps
 *      d) Store snapshots for audit trail
 *    - The same copy-at-creation-time behavior applies
 *
 * EXAMPLE CURRENT FLOW:
 *   Manager creates onboarding for Alice with template "Engineer Standard"
 *   → Template "Engineer Standard" has steps [1, 2, 3]
 *   → System copies [1, 2, 3] into instance.steps
 *   → Alice sees [1, 2, 3] forever, even if template later changes to [1, 2, 3, 4]
 *
 * EXAMPLE FUTURE FLOW (Milestone 4+):
 *   Manager creates onboarding for Bob with profiles ["Engineer", "Team Lead"]
 *   → "Engineer" template has steps [1, 2, 3]
 *   → "Team Lead" template has steps [3, 4, 5]
 *   → System merges: [1, 2, 3, 4, 5] (step 3 deduplicated)
 *   → Stores snapshots for audit trail
 *   → Bob sees [1, 2, 3, 4, 5] forever
 */
export interface OnboardingInstance {
  // Basic employee information
  id: string;
  employeeName: string;
  employeeEmail: string;

  // System access control (not content)
  role: string; // e.g., 'Engineering', 'Sales' - used for role-based filtering, not determining steps

  department: string;

  // CURRENT (Single template): The explicit template selected at creation
  templateId: string; // e.g., 'template_engineer_std_xyz789' - THIS determines which steps employee sees
  steps: Step[]; // COPIED from template at creation - changes to template don't affect this

  // Progress tracking
  createdAt: number; // Unix timestamp
  startDate?: number; // Unix timestamp for employee's start date, optional
  completedAt?: number; // Unix timestamp when onboarding was completed
  progress: number; // 0-100 percentage (calculated from completed steps)
  status: 'active' | 'completed' | 'on_hold';

  // FUTURE (Milestone 4+): Multi-profile/template support for backward compatibility
  profileIds?: string[]; // Array of profile IDs assigned to this onboarding run
  templateIds?: string[]; // Array of all template IDs used (for audit trail)
  templateSnapshots?: {
    // Map of template snapshots captured at instantiation time
    // Enables employees to see which profile had which steps
    [templateId: string]: {
      profileId: string;
      steps: Step[];
      templateName: string;
      capturedAt: number;
    };
  };
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
  onboardingInstances?: OnboardingInstance[];
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
