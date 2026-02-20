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
  logActivity,
  subscribeToActivities,
} from './activityService';

// -- Suggestion Service --
export {
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
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  subscribeToTemplates,
} from './templateService';

// -- Instance Service --
export {
  getInstanceByEmployeeEmail,
  updateOnboardingInstance,
  updateStepStatus,
  deleteOnboardingInstance,
  createOnboardingRunFromTemplate,
  OnboardingValidationError,
  subscribeToSteps,
  subscribeToOnboardingInstances,
  subscribeToEmployeeInstance,
} from './instanceService';
export type { CreateOnboardingRunInput } from './instanceService';

// -- User Service --
export {
  getUser,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  userEmailExists,
  creatorExists,
  subscribeToUsers,
  getAuthCredential,
  addUserToAuthCredentials,
} from './userService';
