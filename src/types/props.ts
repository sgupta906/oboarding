/**
 * Component Prop Interfaces for OnboardingHub
 */

import type {
  Step,
  StepStatus,
  Suggestion,
  Activity,
  Profile,
  OnboardingInstance,
} from './models';

export type BadgeColor = 'blue' | 'green' | 'red' | 'amber' | 'slate';

export interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

/**
 * Props for onboarding-specific components
 */
export interface StepCardProps {
  step: Step;
  index: number;
  onStatusChange: (id: number, newStatus: StepStatus) => void;
  onSuggestEdit: (stepId: number) => void;
  onReportStuck: (stepId: number) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  hasPendingSuggestion?: boolean;
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
  isLoading?: boolean;
  readOnly?: boolean;
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
  isLoading?: boolean;
}

export interface ActivityFeedProps {
  activities: Activity[];
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
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  loadingSuggestionIds?: Set<number | string>;
  onboardingInstances?: OnboardingInstance[];
}

export interface ActivitySectionProps {
  activities: Activity[];
}
