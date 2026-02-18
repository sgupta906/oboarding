/**
 * Supabase Data Layer - Barrel File
 *
 * Re-exports all service functions with the same names as the previous
 * dataClient.ts and userOperations.ts exports. This enables hooks and
 * components to switch import paths without any logic changes.
 *
 * Supabase Data Layer - Service Exports
 */

// -- Activity Service --
export {
  listActivities,
  logActivity,
  subscribeToActivities,
} from './activityService';

// -- Suggestion Service --
export {
  listSuggestions,
  createSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  subscribeToSuggestions,
} from './suggestionService';

// -- Role Service --
export {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  roleNameExists,
  isRoleInUse,
  subscribeToRoles,
} from './roleService';

// -- Template Service --
export {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  subscribeToTemplates,
} from './templateService';

// -- Instance Service --
export {
  listOnboardingInstances,
  getOnboardingInstance,
  getInstanceByEmployeeEmail,
  createOnboardingInstance,
  updateOnboardingInstance,
  updateStepStatus,
  deleteOnboardingInstance,
  createOnboardingRunFromTemplate,
  OnboardingValidationError,
  subscribeToOnboardingInstance,
  subscribeToSteps,
  subscribeToOnboardingInstances,
  subscribeToEmployeeInstance,
} from './instanceService';
export type { CreateOnboardingRunInput } from './instanceService';

// -- User Service --
export {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  userEmailExists,
  creatorExists,
  subscribeToUsers,
  addUserToAuthCredentials,
  getAuthCredential,
  removeUserFromAuthCredentials,
  saveLocalUsers,
  setDisableDefaultUserSeeding,
  clearAllUsersForTesting,
} from './userService';
