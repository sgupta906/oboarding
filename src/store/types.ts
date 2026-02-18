/**
 * Zustand Store Type Definitions
 * Slice interfaces and combined store type
 */

import type {
  OnboardingInstance,
  Step,
  StepStatus,
  User,
  UserFormData,
  Activity,
  Suggestion,
  SuggestionStatus,
} from '../types';

/** State and actions for the onboarding instances slice */
export interface InstancesSlice {
  instances: OnboardingInstance[];
  instancesLoading: boolean;
  instancesError: Error | null;
  _startInstancesSubscription: () => () => void;
  _addInstance: (instance: OnboardingInstance) => void;
  _removeInstance: (instanceId: string) => Promise<void>;
  _updateInstance: (instanceId: string, updates: Partial<OnboardingInstance>) => Promise<void>;
}

/** State and actions for the steps slice (keyed by instanceId) */
export interface StepsSlice {
  stepsByInstance: Record<string, Step[]>;
  stepsLoadingByInstance: Record<string, boolean>;
  stepsErrorByInstance: Record<string, Error | null>;
  _startStepsSubscription: (instanceId: string) => () => void;
  _updateStepStatus: (
    instanceId: string,
    stepId: number,
    status: StepStatus
  ) => Promise<void>;
}

/** State and actions for the users slice */
export interface UsersSlice {
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  _startUsersSubscription: () => () => void;
  _createUser: (data: UserFormData, createdBy: string) => Promise<User>;
  _editUser: (userId: string, data: Partial<UserFormData>) => Promise<void>;
  _removeUser: (userId: string) => Promise<void>;
  _fetchUser: (userId: string) => Promise<User | null>;
  _resetUsersError: () => void;
}

/** State and actions for the activities slice */
export interface ActivitiesSlice {
  activities: Activity[];
  activitiesLoading: boolean;
  activitiesError: Error | null;
  _startActivitiesSubscription: () => () => void;
}

/** State and actions for the suggestions slice */
export interface SuggestionsSlice {
  suggestions: Suggestion[];
  suggestionsLoading: boolean;
  suggestionsError: Error | null;
  _startSuggestionsSubscription: () => () => void;
  _optimisticUpdateSuggestionStatus: (
    id: number | string,
    status: SuggestionStatus
  ) => Suggestion[];
  _optimisticRemoveSuggestion: (id: number | string) => Suggestion[];
  _rollbackSuggestions: (snapshot: Suggestion[]) => void;
  _addSuggestion: (suggestion: Suggestion) => void;
}

/** Combined store type. All slices are composed via intersection. */
export type OnboardingStore = InstancesSlice &
  StepsSlice &
  UsersSlice &
  ActivitiesSlice &
  SuggestionsSlice;
