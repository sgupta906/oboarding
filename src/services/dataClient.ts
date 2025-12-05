/**
 * Data Access Layer for OnboardingHub
 * Abstracts all Firestore read/write operations with type safety and error handling
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
  Template,
  OnboardingInstance,
  Suggestion,
  Activity,
  Step,
  StepStatus,
  CustomRole,
  Profile,
  ProfileTemplate,
} from '../types';
import { addUserToAuthCredentials, createUser, userEmailExists } from './userOperations';

// ============================================================================
// Collection References
// ============================================================================

const TEMPLATES_COLLECTION = 'templates';
const ONBOARDING_INSTANCES_COLLECTION = 'onboarding_instances';
const SUGGESTIONS_COLLECTION = 'suggestions';
const ACTIVITIES_COLLECTION = 'activities';
const ROLES_COLLECTION = 'roles';
const PROFILES_COLLECTION = 'profiles';
const PROFILE_TEMPLATES_COLLECTION = 'profileTemplates';

// ============================================================================
// LocalStorage Keys and Helpers for Development Fallback
// ============================================================================

const ROLES_STORAGE_KEY = 'onboardinghub_roles';
const PROFILES_STORAGE_KEY = 'onboardinghub_profiles';
const PROFILE_TEMPLATES_STORAGE_KEY = 'onboardinghub_profile_templates';
const ONBOARDING_INSTANCES_STORAGE_KEY = 'onboardinghub_onboarding_instances';
const TEMPLATES_STORAGE_KEY = 'onboardinghub_templates';

// Default roles to pre-seed when no roles exist
const DEFAULT_ROLES: Omit<CustomRole, 'id'>[] = [
  { name: 'Engineering', description: 'Software engineering team members', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system' },
  { name: 'Sales', description: 'Sales and business development team', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system' },
  { name: 'Product', description: 'Product management team', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system' },
  { name: 'HR', description: 'Human resources team', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system' },
  { name: 'Operations', description: 'Operations and logistics team', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system' },
  { name: 'Design', description: 'UX/UI design team', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system' },
  { name: 'Marketing', description: 'Marketing and communications team', createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system' },
];

// Default profiles to pre-seed when no profiles exist
const DEFAULT_PROFILES: Omit<Profile, 'id'>[] = [
  { name: 'Engineer', description: 'Software engineer onboarding', roleTags: ['Engineering', 'All'], createdAt: Date.now(), createdBy: 'system' },
  { name: 'Intern', description: 'Intern onboarding', roleTags: ['All'], createdAt: Date.now(), createdBy: 'system' },
  { name: 'Sales', description: 'Sales team onboarding', roleTags: ['Sales', 'All'], createdAt: Date.now(), createdBy: 'system' },
  { name: 'Product Manager', description: 'Product manager onboarding', roleTags: ['Product', 'All'], createdAt: Date.now(), createdBy: 'system' },
];

/**
 * Gets roles from localStorage, initializing with defaults if empty
 */
function getLocalRoles(): CustomRole[] {
  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Don't auto-initialize - return empty array
    // Tests can call seedDefaultRoles explicitly, and app can initialize on first use
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves roles to localStorage
 */
function saveLocalRoles(roles: CustomRole[]): void {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
    // Dispatch custom event to notify listeners
    window.dispatchEvent(new CustomEvent('rolesStorageChange', { detail: roles }));
  } catch (error) {
    console.error('Failed to save roles to localStorage:', error);
  }
}

/**
 * Gets profiles from localStorage, initializing with defaults if empty
 */
function getLocalProfiles(): Profile[] {
  try {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Don't auto-initialize - return empty array
    // Tests can seed explicitly, and app can initialize on first use
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves profiles to localStorage
 */
function saveLocalProfiles(profiles: Profile[]): void {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    // Dispatch custom event to notify listeners
    window.dispatchEvent(new CustomEvent('profilesStorageChange', { detail: profiles }));
  } catch (error) {
    console.error('Failed to save profiles to localStorage:', error);
  }
}

/**
 * Gets profile templates from localStorage
 */
function getLocalProfileTemplates(): ProfileTemplate[] {
  try {
    const stored = localStorage.getItem(PROFILE_TEMPLATES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves profile templates to localStorage
 */
function saveLocalProfileTemplates(templates: ProfileTemplate[]): void {
  try {
    localStorage.setItem(PROFILE_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    // Dispatch custom event to notify listeners
    window.dispatchEvent(
      new CustomEvent('profileTemplatesStorageChange', { detail: templates })
    );
  } catch (error) {
    console.error('Failed to save profile templates to localStorage:', error);
  }
}

/**
 * Checks if Firebase/Firestore is available and working
 */
function isFirestoreAvailable(): boolean {
  try {
    // Check if we're using emulator or have valid config
    const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
    const hasConfig = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
    return useEmulator || hasConfig;
  } catch {
    return false;
  }
}

/**
 * Gets onboarding instances from localStorage
 */
function getLocalOnboardingInstances(): OnboardingInstance[] {
  try {
    const stored = localStorage.getItem(ONBOARDING_INSTANCES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves onboarding instances to localStorage and dispatches update event
 */
function saveLocalOnboardingInstances(instances: OnboardingInstance[]): void {
  try {
    localStorage.setItem(ONBOARDING_INSTANCES_STORAGE_KEY, JSON.stringify(instances));
    window.dispatchEvent(new CustomEvent('onboardingInstancesStorageChange', { detail: instances }));
  } catch (error) {
    console.error('Failed to save onboarding instances to localStorage:', error);
  }
}

/**
 * Gets templates from localStorage
 */
function getLocalTemplates(): Template[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

// ============================================================================
// Template Operations
// ============================================================================

/**
 * Fetches all onboarding templates
 * @returns Promise resolving to array of templates
 */
export async function listTemplates(): Promise<Template[]> {
  try {
    const templatesRef = collection(firestore, TEMPLATES_COLLECTION);
    const snapshot = await getDocs(templatesRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Template));
  } catch (error) {
    throw new Error(
      `Failed to fetch templates: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetches a single template by ID
 * Falls back to localStorage if Firestore is unavailable
 * @param id - Template document ID
 * @returns Promise resolving to template or null if not found
 */
export async function getTemplate(id: string): Promise<Template | null> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, TEMPLATES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Template;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localTemplates = getLocalTemplates();
  return localTemplates.find((t) => t.id === id) || null;
}

/**
 * Creates a new template
 * @param template - Template data without id and createdAt
 * @returns Promise resolving to new document ID
 */
export async function createTemplate(
  template: Omit<Template, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const templatesRef = collection(firestore, TEMPLATES_COLLECTION);
    const docRef = await addDoc(templatesRef, {
      ...template,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(
      `Failed to create template: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Updates an existing template
 * @param id - Template document ID
 * @param updates - Partial template data to update
 * @returns Promise resolving when update is complete
 */
export async function updateTemplate(
  id: string,
  updates: Partial<Template>
): Promise<void> {
  try {
    const docRef = doc(firestore, TEMPLATES_COLLECTION, id);
    // Remove id and createdAt from updates to prevent overwriting them
    const { id: _, createdAt: __, ...safeUpdates } = updates;
    await updateDoc(docRef, {
      ...safeUpdates,
      updatedAt: Date.now(),
    });

    // Sync new steps to all active onboarding instances using this template
    if (updates.steps) {
      await syncTemplateStepsToInstances(id, updates.steps);
    }
  } catch (error) {
    throw new Error(
      `Failed to update template ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Syncs new steps from an updated template to all active onboarding instances
 *
 * Security & Data Integrity Considerations:
 * - Only adds NEW steps that don't already exist in the instance
 * - Preserves completed/stuck status for existing steps - never removes progress
 * - Compares steps by numeric ID to detect duplicates
 * - Handles both Firestore and localStorage scenarios
 * - Silently skips instances that fail to update (logs warning but doesn't throw)
 *
 * Algorithm:
 * 1. Find all OnboardingInstance documents where templateId matches
 * 2. For each instance, identify which template steps are new (not in instance.steps)
 * 3. Append new steps to instance.steps (preserving order)
 * 4. Update the instance in Firestore/localStorage
 * 5. Recalculate progress percentage based on current step count
 *
 * @param templateId - The template ID that was updated
 * @param newSteps - The updated steps array from the template
 * @returns Promise resolving when all instances are synced
 */
async function syncTemplateStepsToInstances(templateId: string, newSteps: Step[]): Promise<void> {
  try {
    // Step 1: Find all instances using this template
    let instances: OnboardingInstance[] = [];

    if (isFirestoreAvailable()) {
      try {
        const instancesRef = collection(firestore, ONBOARDING_INSTANCES_COLLECTION);
        const instanceQuery = query(instancesRef, where('templateId', '==', templateId));
        const snapshot = await getDocs(instanceQuery);
        instances = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as OnboardingInstance));
      } catch (error) {
        console.warn('Failed to query instances from Firestore, falling back to localStorage:', error);
        // Fall through to localStorage fallback below
      }
    }

    // Fallback: Check localStorage instances as well
    if (instances.length === 0) {
      const localInstances = getLocalOnboardingInstances();
      instances = localInstances.filter((inst) => inst.templateId === templateId);
    }

    // Step 2: Sync new steps to each instance
    for (const instance of instances) {
      try {
        // Create a set of existing step IDs for O(1) lookup
        const existingStepIds = new Set(instance.steps.map((step) => step.id));

        // Find new steps that don't already exist in this instance
        const stepsToAdd = newSteps.filter((step) => !existingStepIds.has(step.id));

        if (stepsToAdd.length === 0) {
          // No new steps to add, skip this instance
          continue;
        }

        // Step 3: Merge new steps while preserving existing step data and status
        const mergedSteps = [...instance.steps, ...stepsToAdd];

        // Step 4: Recalculate progress based on current steps and completed count
        // Progress should only count steps that existed before the sync or are already completed
        // New steps start as 'pending', so they don't affect progress calculation
        const completedCount = mergedSteps.filter((step) => step.status === 'completed').length;
        const progress =
          mergedSteps.length === 0 ? 0 : Math.round((completedCount / mergedSteps.length) * 100);

        // Step 5: Update the instance with merged steps and new progress
        await updateOnboardingInstance(instance.id, {
          steps: mergedSteps,
          progress,
        });

        console.log(
          `Synced ${stepsToAdd.length} new step(s) to instance ${instance.id} (${instance.employeeEmail})`
        );
      } catch (error) {
        // Log warning but continue with other instances
        console.warn(
          `Failed to sync template steps to instance ${instance.id}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  } catch (error) {
    console.warn(
      `Failed to sync template steps to instances for template ${templateId}:`,
      error instanceof Error ? error.message : String(error)
    );
    // Don't throw - template update already succeeded, sync failure shouldn't block it
  }
}

/**
 * Deletes a template
 * @param id - Template document ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteTemplate(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, TEMPLATES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(
      `Failed to delete template ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// OnboardingInstance Operations
// ============================================================================

/**
 * Fetches all onboarding instances
 * @returns Promise resolving to array of onboarding instances
 */
export async function listOnboardingInstances(): Promise<OnboardingInstance[]> {
  try {
    const instancesRef = collection(firestore, ONBOARDING_INSTANCES_COLLECTION);
    const snapshot = await getDocs(instancesRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as OnboardingInstance));
  } catch (error) {
    throw new Error(
      `Failed to fetch onboarding instances: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetches a single onboarding instance by ID
 * @param id - OnboardingInstance document ID
 * @returns Promise resolving to instance or null if not found
 */
export async function getOnboardingInstance(
  id: string
): Promise<OnboardingInstance | null> {
  try {
    const docRef = doc(firestore, ONBOARDING_INSTANCES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as OnboardingInstance;
  } catch (error) {
    throw new Error(
      `Failed to fetch onboarding instance ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Creates a new onboarding instance
 * @param instance - Instance data without id and createdAt
 * @returns Promise resolving to new document ID
 */
export async function createOnboardingInstance(
  instance: Omit<OnboardingInstance, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const instancesRef = collection(firestore, ONBOARDING_INSTANCES_COLLECTION);
    const docRef = await addDoc(instancesRef, {
      ...instance,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(
      `Failed to create onboarding instance: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Updates an existing onboarding instance
 * @param id - OnboardingInstance document ID
 * @param updates - Partial instance data to update
 * @returns Promise resolving when update is complete
 */
export async function updateOnboardingInstance(
  id: string,
  updates: Partial<OnboardingInstance>
): Promise<void> {
  try {
    const docRef = doc(firestore, ONBOARDING_INSTANCES_COLLECTION, id);
    // Remove id and createdAt from updates to prevent overwriting them
    const { id: _, createdAt: __, ...safeUpdates } = updates;
    await updateDoc(docRef, safeUpdates);
  } catch (error) {
    throw new Error(
      `Failed to update onboarding instance ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Updates the status of a step inside an onboarding instance and recalculates progress
 *
 * CRITICAL BUG FIX: Added validation that stepId exists before attempting update.
 * Previously, if stepId didn't exist, the update would silently fail with no error,
 * leaving the caller unaware that the operation didn't succeed.
 *
 * Error handling:
 * - Throws if instance doesn't exist
 * - Throws if stepId is not found in the instance's steps array
 * - Preserves all existing step data if update succeeds
 * - Recalculates progress percentage correctly
 *
 * @param instanceId - Onboarding instance ID containing the steps
 * @param stepId - Step ID to update (numeric ID matching step.id)
 * @param status - New status for the step ('pending', 'completed', 'stuck')
 * @throws Error if instance not found
 * @throws Error if stepId doesn't exist in the instance's steps
 */
export async function updateStepStatus(
  instanceId: string,
  stepId: number,
  status: StepStatus
): Promise<void> {
  // Step 1: Fetch the instance
  const instance = await getOnboardingInstance(instanceId);
  if (!instance) {
    throw new Error(`Onboarding instance not found: ${instanceId}`);
  }

  // Step 2: Validate that stepId exists in the steps array
  const stepExists = instance.steps.some((step) => step.id === stepId);
  if (!stepExists) {
    throw new Error(
      `Step with ID ${stepId} not found in onboarding instance ${instanceId}. ` +
      `Available step IDs: ${instance.steps.map((s) => s.id).join(', ')}`
    );
  }

  // Step 3: Update the step with the new status, preserving all other data
  const updatedSteps = instance.steps.map((step) =>
    step.id === stepId ? { ...step, status } : step
  );

  // Step 4: Recalculate progress based on completed steps
  const completedCount = updatedSteps.filter((step) => step.status === 'completed').length;
  const progress = updatedSteps.length === 0
    ? 0
    : Math.round((completedCount / updatedSteps.length) * 100);

  // Step 5: Update the instance with new steps and progress
  await updateOnboardingInstance(instanceId, {
    steps: updatedSteps,
    progress,
  });
}

// ============================================================================
// OnboardingRun Creation with Validation
// ============================================================================

/**
 * Validation error class for onboarding run creation
 */
export class OnboardingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnboardingValidationError';
  }
}

/**
 * Employee data required for creating an onboarding run
 * Uses strict validation to prevent invalid data from reaching Firestore
 */
export interface CreateOnboardingRunInput {
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  templateId: string;
  startDate?: number; // Optional Unix timestamp for employee start date
}

/**
 * Creates a new onboarding instance from a template
 *
 * This function:
 * 1. Validates all required input fields are present and non-empty
 * 2. Fetches the template to ensure it exists and copy its steps
 * 3. Initializes the instance with progress=0 and status='active'
 * 4. Creates the instance in Firestore (with localStorage fallback)
 * 5. Adds the employee to auth credentials so they can sign in
 * 6. Returns the fully populated instance with generated ID
 *
 * @param employeeData - Employee information for the onboarding run
 * @returns Promise resolving to the created OnboardingInstance with ID
 * @throws OnboardingValidationError if validation fails
 * @throws Error if storage operations fail
 */
/**
 * Creates a new onboarding instance by copying steps from a template.
 *
 * CRITICAL: Steps are COPIED from the template at instance creation time, not live-linked.
 * This means:
 * 1. Employee progress is preserved even if the template is deleted
 * 2. Template updates don't affect in-progress onboarding
 * 3. Each instance has an immutable audit trail of steps as they were at creation
 * 4. New steps can be added via syncTemplateStepsToInstances(), but cannot be removed
 *
 * This is the ONLY way to determine which steps an employee sees.
 * Steps are NOT determined by role or profile—only by the template selected here.
 *
 * For future multi-profile support (Milestone 4+), this function will:
 * - Accept profileIds[] instead of/in addition to templateId
 * - Fetch multiple profile templates
 * - Merge steps (deduplicate by step.id)
 * - Store templateSnapshots for audit trail
 *
 * @param employeeData - Object with templateId, employee name, email, role, department
 * @returns OnboardingInstance with copied steps
 * @throws OnboardingValidationError if template not found or validation fails
 */
export async function createOnboardingRunFromTemplate(
  employeeData: CreateOnboardingRunInput
): Promise<OnboardingInstance> {
  // Step 1: Validate all required fields are present and non-empty
  validateEmployeeData(employeeData);

  // Step 2: Fetch the template to ensure it exists
  const template = await getTemplate(employeeData.templateId);
  if (!template) {
    throw new OnboardingValidationError(
      `Template not found: ${employeeData.templateId}. Cannot create onboarding run without a valid template.`
    );
  }

  // Step 3: Create the new instance with template's steps
  const now = Date.now();
  const normalizedEmail = employeeData.employeeEmail.toLowerCase().trim();
  const newInstanceData: Omit<OnboardingInstance, 'id'> = {
    employeeName: employeeData.employeeName,
    employeeEmail: normalizedEmail,
    role: employeeData.role,
    department: employeeData.department,
    templateId: employeeData.templateId,
    steps: template.steps, // ← CRITICAL: COPY steps, not reference
    createdAt: now,
    startDate: employeeData.startDate, // Optional start date
    progress: 0, // New instances always start at 0% progress
    status: 'active' as const, // New instances are always active
  };

  let instanceId: string;

  // Step 4: Try Firestore first, fallback to localStorage
  if (isFirestoreAvailable()) {
    try {
      const instancesRef = collection(firestore, ONBOARDING_INSTANCES_COLLECTION);
      const docRef = await addDoc(instancesRef, newInstanceData);
      instanceId = docRef.id;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
      // Fall through to localStorage
      instanceId = `local-instance-${now}`;
      const localInstances = getLocalOnboardingInstances();
      const newInstance: OnboardingInstance = {
        id: instanceId,
        ...newInstanceData,
      };
      saveLocalOnboardingInstances([...localInstances, newInstance]);
    }
  } else {
    // Use localStorage
    instanceId = `local-instance-${now}`;
    const localInstances = getLocalOnboardingInstances();
    const newInstance: OnboardingInstance = {
      id: instanceId,
      ...newInstanceData,
    };
    saveLocalOnboardingInstances([...localInstances, newInstance]);
  }

  // Step 5: Add the employee to auth credentials so they can sign in
  // Employee role is 'employee' by default for new onboarding users
  addUserToAuthCredentials(normalizedEmail, 'employee', instanceId);
  await ensureUserRecordForOnboarding({
    email: normalizedEmail,
    name: employeeData.employeeName,
    department: employeeData.department,
  });

  // Step 6: Return the complete instance with the generated ID
  return {
    id: instanceId,
    ...newInstanceData,
  };
}

interface EnsureUserRecordInput {
  email: string;
  name: string;
  department: string;
}

async function ensureUserRecordForOnboarding({ email, name, department }: EnsureUserRecordInput) {
  try {
    const exists = await userEmailExists(email);
    if (exists) {
      return;
    }

    await createUser(
      {
        email,
        name,
        roles: ['employee'],
        profiles: department ? [department] : [],
        createdBy: 'system',
      },
      'system'
    );
  } catch (error) {
    console.warn('Failed to ensure user record for onboarding:', error);
  }
}

/**
 * Validates that all required employee data fields are present and valid
 *
 * Security considerations:
 * - All string fields must be non-empty (after trimming whitespace)
 * - Email format is validated as a basic check (not comprehensive)
 * - Empty strings or whitespace-only strings are rejected
 *
 * @param data - Employee data to validate
 * @throws OnboardingValidationError if any validation fails
 */
function validateEmployeeData(data: CreateOnboardingRunInput): void {
  // Helper to check if string field is valid (non-empty, not just whitespace)
  const isValidString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

  // Check required fields
  if (!isValidString(data.employeeName)) {
    throw new OnboardingValidationError(
      'employeeName is required and must be a non-empty string'
    );
  }

  if (!isValidString(data.employeeEmail)) {
    throw new OnboardingValidationError(
      'employeeEmail is required and must be a non-empty string'
    );
  }

  // Validate email format with basic regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.employeeEmail)) {
    throw new OnboardingValidationError(
      `employeeEmail must be a valid email address, got: ${data.employeeEmail}`
    );
  }

  if (!isValidString(data.role)) {
    throw new OnboardingValidationError(
      'role is required and must be a non-empty string'
    );
  }

  if (!isValidString(data.department)) {
    throw new OnboardingValidationError(
      'department is required and must be a non-empty string'
    );
  }

  if (!isValidString(data.templateId)) {
    throw new OnboardingValidationError(
      'templateId is required and must be a non-empty string'
    );
  }

  // Optional: validate startDate if provided
  if (data.startDate !== undefined) {
    if (typeof data.startDate !== 'number' || data.startDate < 0) {
      throw new OnboardingValidationError(
        'startDate must be a valid Unix timestamp (non-negative number)'
      );
    }
  }
}

// ============================================================================
// Suggestion Operations
// ============================================================================

/**
 * Fetches all suggestions
 * @returns Promise resolving to array of suggestions
 */
export async function listSuggestions(): Promise<Suggestion[]> {
  try {
    const suggestionsRef = collection(firestore, SUGGESTIONS_COLLECTION);
    const snapshot = await getDocs(suggestionsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Suggestion));
  } catch (error) {
    throw new Error(
      `Failed to fetch suggestions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Creates a new suggestion
 * @param suggestion - Suggestion data without id and createdAt
 * @returns Promise resolving to new document ID
 */
export async function createSuggestion(
  suggestion: Omit<Suggestion, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const suggestionsRef = collection(firestore, SUGGESTIONS_COLLECTION);
    const docRef = await addDoc(suggestionsRef, {
      ...suggestion,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(
      `Failed to create suggestion: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Updates the status of a suggestion
 * @param id - Suggestion document ID
 * @param status - New suggestion status
 * @returns Promise resolving when update is complete
 */
export async function updateSuggestionStatus(
  id: string,
  status: 'pending' | 'reviewed' | 'implemented'
): Promise<void> {
  try {
    const docRef = doc(firestore, SUGGESTIONS_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    throw new Error(
      `Failed to update suggestion status ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deletes a suggestion permanently
 */
export async function deleteSuggestion(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, SUGGESTIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(
      `Failed to delete suggestion ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// Activity Operations
// ============================================================================

/**
 * Fetches all activities
 * @returns Promise resolving to array of activities
 */
export async function listActivities(): Promise<Activity[]> {
  try {
    const activitiesRef = collection(firestore, ACTIVITIES_COLLECTION);
    const snapshot = await getDocs(activitiesRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Activity));
  } catch (error) {
    throw new Error(
      `Failed to fetch activities: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Logs a new activity
 * @param activity - Activity data without id and timestamp
 * @returns Promise resolving to new document ID
 */
export async function logActivity(
  activity: Omit<Activity, 'id' | 'timestamp'>
): Promise<string> {
  try {
    const activitiesRef = collection(firestore, ACTIVITIES_COLLECTION);
    const docRef = await addDoc(activitiesRef, {
      ...activity,
      timestamp: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(
      `Failed to log activity: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

/**
 * Subscribes to real-time updates of all templates
 * @param callback - Function called whenever templates change
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToTemplates(
  callback: (templates: Template[]) => void
): Unsubscribe {
  try {
    const templatesRef = collection(firestore, TEMPLATES_COLLECTION);
    return onSnapshot(templatesRef, (snapshot) => {
      const templates = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Template));
      callback(templates);
    });
  } catch (error) {
    throw new Error(
      `Failed to subscribe to templates: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Subscribes to real-time updates of a specific onboarding instance
 * @param instanceId - OnboardingInstance document ID to subscribe to
 * @param callback - Function called whenever instance changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToOnboardingInstance(
  instanceId: string,
  callback: (instance: OnboardingInstance | null) => void
): Unsubscribe {
  try {
    const docRef = doc(firestore, ONBOARDING_INSTANCES_COLLECTION, instanceId);
    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      callback({
        id: docSnap.id,
        ...docSnap.data(),
      } as OnboardingInstance);
    });
  } catch (error) {
    throw new Error(
      `Failed to subscribe to onboarding instance ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Subscribes to real-time updates of steps within an onboarding instance
 * Reads from the instance.steps array field
 * @param instanceId - OnboardingInstance document ID
 * @param callback - Function called whenever steps change
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToSteps(
  instanceId: string,
  callback: (steps: Step[]) => void
): Unsubscribe {
  try {
    const docRef = doc(firestore, ONBOARDING_INSTANCES_COLLECTION, instanceId);
    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback([]);
        return;
      }
      const data = docSnap.data() as OnboardingInstance;
      callback(data.steps || []);
    });
  } catch (error) {
    throw new Error(
      `Failed to subscribe to steps for instance ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Subscribes to real-time updates of all activities
 * @param callback - Function called whenever activities change
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToActivities(
  callback: (activities: Activity[]) => void
): Unsubscribe {
  try {
    const activitiesRef = collection(firestore, ACTIVITIES_COLLECTION);
    return onSnapshot(activitiesRef, (snapshot) => {
      const activities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Activity));
      callback(activities);
    });
  } catch (error) {
    throw new Error(
      `Failed to subscribe to activities: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Subscribes to all onboarding instances for manager dashboards
 */
export function subscribeToOnboardingInstances(
  callback: (instances: OnboardingInstance[]) => void
): Unsubscribe {
  try {
    const instancesRef = collection(firestore, ONBOARDING_INSTANCES_COLLECTION);
    return onSnapshot(instancesRef, (snapshot) => {
      const instances = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as OnboardingInstance));
      callback(instances);
    });
  } catch (error) {
    throw new Error(
      `Failed to subscribe to onboarding instances: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Subscribes to the onboarding instance for a specific employee email
 * Falls back to localStorage if Firestore is unavailable
 */
export function subscribeToEmployeeInstance(
  email: string,
  callback: (instance: OnboardingInstance | null) => void
): Unsubscribe {
  const normalized = email.toLowerCase();
  let firestoreUnsubscribe: Unsubscribe | null = null;

  // Helper to find instance in localStorage
  const findLocalInstance = (): OnboardingInstance | null => {
    const localInstances = getLocalOnboardingInstances();
    const matching = localInstances
      .filter((inst) => inst.employeeEmail.toLowerCase() === normalized)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return matching.length > 0 ? matching[0] : null;
  };

  // Always listen for localStorage changes
  const handleStorageChange = (event: Event) => {
    const customEvent = event as CustomEvent<OnboardingInstance[]>;
    if (customEvent.detail) {
      const matching = customEvent.detail
        .filter((inst) => inst.employeeEmail.toLowerCase() === normalized)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(matching.length > 0 ? matching[0] : null);
    } else {
      callback(findLocalInstance());
    }
  };

  window.addEventListener('onboardingInstancesStorageChange', handleStorageChange);

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const instancesRef = collection(firestore, ONBOARDING_INSTANCES_COLLECTION);
      const instanceQuery = query(instancesRef, where('employeeEmail', '==', normalized));
      firestoreUnsubscribe = onSnapshot(
        instanceQuery,
        (snapshot) => {
          if (snapshot.empty) {
            // No Firestore data, check localStorage
            callback(findLocalInstance());
            return;
          }
          const ordered = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as OnboardingInstance))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          callback(ordered[0]);
        },
        (error) => {
          console.warn('Firestore subscription error, using localStorage:', error);
          callback(findLocalInstance());
        }
      );
    } catch (error) {
      console.warn('Failed to subscribe to Firestore, using localStorage:', error);
      callback(findLocalInstance());
    }
  } else {
    // No Firestore available, use localStorage
    callback(findLocalInstance());
  }

  // Return combined unsubscribe function
  return () => {
    window.removeEventListener('onboardingInstancesStorageChange', handleStorageChange);
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
  };
}

// ============================================================================
// Role Operations (with localStorage fallback for development)
// ============================================================================

/**
 * Fetches all custom roles
 * Falls back to localStorage if Firestore is unavailable
 * @returns Promise resolving to array of custom roles
 */
export async function listRoles(): Promise<CustomRole[]> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const rolesRef = collection(firestore, ROLES_COLLECTION);
      const snapshot = await getDocs(rolesRef);
      const firestoreRoles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as CustomRole));

      // If Firestore returned roles, use them
      if (firestoreRoles.length > 0) {
        return firestoreRoles;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage (will auto-initialize with defaults)
  return getLocalRoles();
}

/**
 * Fetches a single role by ID
 * Falls back to localStorage if Firestore is unavailable
 * @param id - Role document ID
 * @returns Promise resolving to role or null if not found
 */
export async function getRole(id: string): Promise<CustomRole | null> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, ROLES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as CustomRole;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localRoles = getLocalRoles();
  return localRoles.find((r) => r.id === id) || null;
}

/**
 * Checks if a role name already exists (case-insensitive)
 * Security: Prevents duplicate role names
 * @param name - Role name to check
 * @returns Promise resolving to true if role exists, false otherwise
 */
export async function roleNameExists(name: string): Promise<boolean> {
  const normalizedName = name.toLowerCase().trim();

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const rolesRef = collection(firestore, ROLES_COLLECTION);
      const q = query(rolesRef);
      const snapshot = await getDocs(q);

      const exists = snapshot.docs.some((doc) => {
        const role = doc.data() as CustomRole;
        return role.name.toLowerCase() === normalizedName;
      });

      return exists;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localRoles = getLocalRoles();
  return localRoles.some((r) => r.name.toLowerCase() === normalizedName);
}

/**
 * Checks if a role is used in any templates or instances
 * Security: Prevents deletion of roles in use
 * @param roleId - Role ID to check
 * @returns Promise resolving to true if role is used, false otherwise
 */
export async function isRoleInUse(roleId: string): Promise<boolean> {
  const roleName = await getRole(roleId);
  if (!roleName) {
    return false;
  }

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      // Check if role is used in templates
      const templatesRef = collection(firestore, TEMPLATES_COLLECTION);
      const templateQuery = query(templatesRef, where('role', '==', roleName.name));
      const templateSnapshot = await getDocs(templateQuery);

      if (templateSnapshot.size > 0) {
        return true;
      }

      // Check if role is used in onboarding instances
      const instancesRef = collection(firestore, ONBOARDING_INSTANCES_COLLECTION);
      const instanceQuery = query(instancesRef, where('role', '==', roleName.name));
      const instanceSnapshot = await getDocs(instanceQuery);

      return instanceSnapshot.size > 0;
    } catch (error) {
      console.warn('Firestore unavailable for role usage check:', error);
    }
  }

  // In localStorage mode, assume role is not in use (safe for dev)
  return false;
}

/**
 * Creates a new custom role
 * Falls back to localStorage if Firestore is unavailable
 * Security: Validates inputs and prevents duplicates
 * @param name - Role name (required, unique)
 * @param description - Optional role description
 * @param createdBy - User ID of the role creator
 * @returns Promise resolving to new CustomRole with generated ID
 */
export async function createRole(
  name: string,
  description: string | undefined,
  createdBy: string
): Promise<CustomRole> {
  const now = Date.now();
  const trimmedName = name.trim();
  const trimmedDesc = description !== undefined ? description.trim() : undefined;

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const rolesRef = collection(firestore, ROLES_COLLECTION);
      const docRef = await addDoc(rolesRef, {
        name: trimmedName,
        description: trimmedDesc,
        createdAt: now,
        updatedAt: now,
        createdBy,
      });

      return {
        id: docRef.id,
        name: trimmedName,
        description: trimmedDesc,
        createdAt: now,
        updatedAt: now,
        createdBy,
      };
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localRoles = getLocalRoles();
  const newRole: CustomRole = {
    id: `local-role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: trimmedName,
    description: trimmedDesc,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
  saveLocalRoles([...localRoles, newRole]);
  return newRole;
}

/**
 * Updates an existing role
 * Falls back to localStorage if Firestore is unavailable
 * Security: Prevents updating id and createdBy
 * @param roleId - Role document ID
 * @param updates - Partial role updates (name and/or description)
 * @returns Promise resolving when update is complete
 */
export async function updateRole(
  roleId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  const now = Date.now();

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, ROLES_COLLECTION, roleId);

      const safeUpdates: Record<string, unknown> = {
        updatedAt: now,
      };

      if (updates.name) {
        safeUpdates.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        safeUpdates.description = updates.description.trim();
      }

      await updateDoc(docRef, safeUpdates);
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localRoles = getLocalRoles();
  const updatedRoles = localRoles.map((role) => {
    if (role.id === roleId) {
      return {
        ...role,
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.description !== undefined && {
          description: updates.description.trim(),
        }),
        updatedAt: now,
      };
    }
    return role;
  });
  saveLocalRoles(updatedRoles);
}

/**
 * Deletes a custom role
 * Falls back to localStorage if Firestore is unavailable
 * Security: Checks if role is in use before deletion
 * @param roleId - Role document ID
 * @returns Promise resolving when deletion is complete
 * @throws Error if role is in use
 */
export async function deleteRole(roleId: string): Promise<void> {
  // Check if role is in use
  const inUse = await isRoleInUse(roleId);
  if (inUse) {
    throw new Error(
      'Cannot delete role that is in use by templates or onboarding instances. Please update or delete those references first.'
    );
  }

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, ROLES_COLLECTION, roleId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localRoles = getLocalRoles();
  const filteredRoles = localRoles.filter((r) => r.id !== roleId);
  saveLocalRoles(filteredRoles);
}

/**
 * Subscribes to real-time updates of all roles
 * Falls back to localStorage with custom event listeners
 * @param callback - Function called whenever roles change
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToRoles(
  callback: (roles: CustomRole[]) => void
): Unsubscribe {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const rolesRef = collection(firestore, ROLES_COLLECTION);
      return onSnapshot(
        rolesRef,
        (snapshot) => {
          const roles = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as CustomRole));
          // If Firestore has roles, use them
          if (roles.length > 0) {
            callback(roles);
          } else {
            // Firestore is empty, fall back to local
            callback(getLocalRoles());
          }
        },
        (error) => {
          // On error, fall back to localStorage
          console.warn('Firestore subscription error, using localStorage:', error);
          callback(getLocalRoles());
        }
      );
    } catch (error) {
      console.warn('Failed to subscribe to Firestore, using localStorage:', error);
    }
  }

  // Fallback: use localStorage with custom event listener
  const handleStorageChange = (event: Event) => {
    const customEvent = event as CustomEvent<CustomRole[]>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getLocalRoles());
    }
  };

  // Initial callback with current roles
  callback(getLocalRoles());

  // Listen for changes
  window.addEventListener('rolesStorageChange', handleStorageChange);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('rolesStorageChange', handleStorageChange);
  };
}

// ============================================================================
// Profile Operations (with localStorage fallback for development)
// ============================================================================

/**
 * Fetches all profiles
 * Falls back to localStorage if Firestore is unavailable
 * @returns Promise resolving to array of profiles
 */
export async function listProfiles(): Promise<Profile[]> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const profilesRef = collection(firestore, PROFILES_COLLECTION);
      const snapshot = await getDocs(profilesRef);
      const firestoreProfiles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Profile));

      // If Firestore returned profiles, use them
      if (firestoreProfiles.length > 0) {
        return firestoreProfiles;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage (will auto-initialize with defaults)
  return getLocalProfiles();
}

/**
 * Fetches a single profile by ID
 * Falls back to localStorage if Firestore is unavailable
 * @param id - Profile document ID
 * @returns Promise resolving to profile or null if not found
 */
export async function getProfile(id: string): Promise<Profile | null> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, PROFILES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Profile;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localProfiles = getLocalProfiles();
  return localProfiles.find((p) => p.id === id) || null;
}

/**
 * Creates a new profile
 * Falls back to localStorage if Firestore is unavailable
 * Security: Validates inputs
 * @param name - Profile name
 * @param description - Optional profile description
 * @param roleTags - Array of role tags for this profile
 * @param createdBy - User ID of the profile creator
 * @returns Promise resolving to new Profile with generated ID
 */
export async function createProfile(
  name: string,
  description: string | undefined,
  roleTags: string[],
  createdBy: string
): Promise<Profile> {
  const now = Date.now();
  const trimmedName = name.trim();
  const trimmedDesc = description ? description.trim() : undefined;

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const profilesRef = collection(firestore, PROFILES_COLLECTION);
      const docRef = await addDoc(profilesRef, {
        name: trimmedName,
        description: trimmedDesc,
        roleTags,
        createdAt: now,
        createdBy,
      });

      return {
        id: docRef.id,
        name: trimmedName,
        description: trimmedDesc,
        roleTags,
        createdAt: now,
        createdBy,
      };
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localProfiles = getLocalProfiles();
  const newProfile: Profile = {
    id: `local-profile-${Date.now()}`,
    name: trimmedName,
    description: trimmedDesc,
    roleTags,
    createdAt: now,
    createdBy,
  };
  saveLocalProfiles([...localProfiles, newProfile]);
  return newProfile;
}

/**
 * Updates an existing profile
 * Falls back to localStorage if Firestore is unavailable
 * @param profileId - Profile document ID
 * @param updates - Partial profile updates (name, description, and/or roleTags)
 * @returns Promise resolving when update is complete
 */
export async function updateProfile(
  profileId: string,
  updates: { name?: string; description?: string; roleTags?: string[] }
): Promise<void> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, PROFILES_COLLECTION, profileId);

      const safeUpdates: Record<string, unknown> = {};

      if (updates.name) {
        safeUpdates.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        safeUpdates.description = updates.description
          ? updates.description.trim()
          : undefined;
      }

      if (updates.roleTags) {
        safeUpdates.roleTags = updates.roleTags;
      }

      if (Object.keys(safeUpdates).length > 0) {
        await updateDoc(docRef, safeUpdates);
      }
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localProfiles = getLocalProfiles();
  const updatedProfiles = localProfiles.map((profile) => {
    if (profile.id === profileId) {
      return {
        ...profile,
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.description !== undefined && {
          description: updates.description ? updates.description.trim() : undefined,
        }),
        ...(updates.roleTags && { roleTags: updates.roleTags }),
      };
    }
    return profile;
  });
  saveLocalProfiles(updatedProfiles);
}

/**
 * Deletes a profile
 * Falls back to localStorage if Firestore is unavailable
 * @param profileId - Profile document ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteProfile(profileId: string): Promise<void> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, PROFILES_COLLECTION, profileId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localProfiles = getLocalProfiles();
  const filteredProfiles = localProfiles.filter((p) => p.id !== profileId);
  saveLocalProfiles(filteredProfiles);
}

/**
 * Subscribes to real-time updates of all profiles
 * Falls back to localStorage with custom event listeners
 * @param callback - Function called whenever profiles change
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToProfiles(
  callback: (profiles: Profile[]) => void
): Unsubscribe {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const profilesRef = collection(firestore, PROFILES_COLLECTION);
      return onSnapshot(
        profilesRef,
        (snapshot) => {
          const profiles = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Profile));
          // If Firestore has profiles, use them
          if (profiles.length > 0) {
            callback(profiles);
          } else {
            // Firestore is empty, fall back to local
            callback(getLocalProfiles());
          }
        },
        (error) => {
          // On error, fall back to localStorage
          console.warn('Firestore subscription error, using localStorage:', error);
          callback(getLocalProfiles());
        }
      );
    } catch (error) {
      console.warn('Failed to subscribe to Firestore, using localStorage:', error);
    }
  }

  // Fallback: use localStorage with custom event listener
  const handleStorageChange = (event: Event) => {
    const customEvent = event as CustomEvent<Profile[]>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getLocalProfiles());
    }
  };

  // Initial callback with current profiles
  callback(getLocalProfiles());

  // Listen for changes
  window.addEventListener('profilesStorageChange', handleStorageChange);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('profilesStorageChange', handleStorageChange);
  };
}

// ============================================================================
// Profile Template Operations (with localStorage fallback for development)
// ============================================================================

/**
 * Fetches all profile templates, optionally filtered by profileId
 * Falls back to localStorage if Firestore is unavailable
 * @param profileId - Optional profile ID to filter templates by
 * @returns Promise resolving to array of profile templates
 */
export async function listProfileTemplates(profileId?: string): Promise<ProfileTemplate[]> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const templatesRef = profileId
        ? query(
            collection(firestore, PROFILE_TEMPLATES_COLLECTION),
            where('profileId', '==', profileId)
          )
        : collection(firestore, PROFILE_TEMPLATES_COLLECTION);

      const snapshot = await getDocs(templatesRef);
      const firestoreTemplates = snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          profileId: data.profileId as string,
          name: data.name as string,
          description: data.description as string | undefined,
          steps: data.steps as Step[],
          createdAt: data.createdAt as number,
          updatedAt: data.updatedAt as number | undefined,
          createdBy: data.createdBy as string,
          version: data.version as number,
          isPublished: data.isPublished as boolean,
        } as ProfileTemplate;
      });

      // If Firestore returned templates, use them
      if (firestoreTemplates.length > 0) {
        return firestoreTemplates;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localTemplates = getLocalProfileTemplates();
  if (profileId) {
    return localTemplates.filter((t) => t.profileId === profileId);
  }
  return localTemplates;
}

/**
 * Fetches a single profile template by ID
 * Falls back to localStorage if Firestore is unavailable
 * @param id - Profile template document ID
 * @returns Promise resolving to template or null if not found
 */
export async function getProfileTemplate(id: string): Promise<ProfileTemplate | null> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, PROFILE_TEMPLATES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          profileId: data.profileId as string,
          name: data.name as string,
          description: data.description as string | undefined,
          steps: data.steps as Step[],
          createdAt: data.createdAt as number,
          updatedAt: data.updatedAt as number | undefined,
          createdBy: data.createdBy as string,
          version: data.version as number,
          isPublished: data.isPublished as boolean,
        } as ProfileTemplate;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localTemplates = getLocalProfileTemplates();
  return localTemplates.find((t) => t.id === id) || null;
}

/**
 * Creates a new profile template
 * Falls back to localStorage if Firestore is unavailable
 * @param profileId - Parent profile ID
 * @param name - Template name
 * @param description - Optional template description
 * @param steps - Array of steps for this template
 * @param createdBy - User ID of the creator
 * @returns Promise resolving to new ProfileTemplate with generated ID
 */
export async function createProfileTemplate(
  profileId: string,
  name: string,
  description: string | undefined,
  steps: Step[],
  createdBy: string
): Promise<ProfileTemplate> {
  const now = Date.now();
  const trimmedName = name.trim();
  const trimmedDesc = description ? description.trim() : undefined;

  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const templatesRef = collection(firestore, PROFILE_TEMPLATES_COLLECTION);
      const docRef = await addDoc(templatesRef, {
        profileId,
        name: trimmedName,
        description: trimmedDesc,
        steps,
        createdAt: now,
        updatedAt: now,
        createdBy,
        version: 1,
        isPublished: false,
      });

      return {
        id: docRef.id,
        profileId,
        name: trimmedName,
        description: trimmedDesc,
        steps,
        createdAt: now,
        updatedAt: now,
        createdBy,
        version: 1,
        isPublished: false,
      };
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localTemplates = getLocalProfileTemplates();
  const newTemplate: ProfileTemplate = {
    id: `local-template-${Date.now()}`,
    profileId,
    name: trimmedName,
    description: trimmedDesc,
    steps,
    createdAt: now,
    updatedAt: now,
    createdBy,
    version: 1,
    isPublished: false,
  };
  saveLocalProfileTemplates([...localTemplates, newTemplate]);
  return newTemplate;
}

/**
 * Updates an existing profile template
 * Falls back to localStorage if Firestore is unavailable
 * @param templateId - Profile template document ID
 * @param updates - Partial template updates (name, description, steps, isPublished, etc.)
 * @returns Promise resolving when update is complete
 */
export async function updateProfileTemplate(
  templateId: string,
  updates: {
    name?: string;
    description?: string;
    steps?: Step[];
    isPublished?: boolean;
  }
): Promise<void> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, PROFILE_TEMPLATES_COLLECTION, templateId);

      const safeUpdates: Record<string, unknown> = {};

      if (updates.name) {
        safeUpdates.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        safeUpdates.description = updates.description
          ? updates.description.trim()
          : undefined;
      }

      if (updates.steps) {
        safeUpdates.steps = updates.steps;
      }

      if (updates.isPublished !== undefined) {
        safeUpdates.isPublished = updates.isPublished;
      }

      if (Object.keys(safeUpdates).length > 0) {
        safeUpdates.updatedAt = Date.now();
        await updateDoc(docRef, safeUpdates);
      }
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localTemplates = getLocalProfileTemplates();
  const updatedTemplates = localTemplates.map((template) => {
    if (template.id === templateId) {
      return {
        ...template,
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.description !== undefined && {
          description: updates.description ? updates.description.trim() : undefined,
        }),
        ...(updates.steps && { steps: updates.steps }),
        ...(updates.isPublished !== undefined && { isPublished: updates.isPublished }),
        updatedAt: Date.now(),
      };
    }
    return template;
  });
  saveLocalProfileTemplates(updatedTemplates);
}

/**
 * Deletes a profile template
 * Falls back to localStorage if Firestore is unavailable
 * @param templateId - Profile template document ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteProfileTemplate(templateId: string): Promise<void> {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, PROFILE_TEMPLATES_COLLECTION, templateId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Fallback to localStorage
  const localTemplates = getLocalProfileTemplates();
  const filteredTemplates = localTemplates.filter((t) => t.id !== templateId);
  saveLocalProfileTemplates(filteredTemplates);
}

/**
 * Subscribes to real-time updates of profile templates for a specific profile
 * Falls back to localStorage with custom event listeners
 * @param profileId - Profile ID to filter templates by
 * @param callback - Function called whenever templates change
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToProfileTemplates(
  profileId: string,
  callback: (templates: ProfileTemplate[]) => void
): Unsubscribe {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const templatesRef = query(
        collection(firestore, PROFILE_TEMPLATES_COLLECTION),
        where('profileId', '==', profileId)
      );
      return onSnapshot(
        templatesRef,
        (snapshot) => {
          const templates = snapshot.docs.map((doc) => {
            const data = doc.data() as Record<string, unknown>;
            return {
              id: doc.id,
              profileId: data.profileId as string,
              name: data.name as string,
              description: data.description as string | undefined,
              steps: data.steps as Step[],
              createdAt: data.createdAt as number,
              updatedAt: data.updatedAt as number | undefined,
              createdBy: data.createdBy as string,
              version: data.version as number,
              isPublished: data.isPublished as boolean,
            } as ProfileTemplate;
          });
          // If Firestore has templates, use them
          if (templates.length > 0) {
            callback(templates);
          } else {
            // Firestore is empty, fall back to local
            const localTemplates = getLocalProfileTemplates().filter(
              (t) => t.profileId === profileId
            );
            callback(localTemplates);
          }
        },
        (error) => {
          // On error, fall back to localStorage
          console.warn('Firestore subscription error, using localStorage:', error);
          const localTemplates = getLocalProfileTemplates().filter(
            (t) => t.profileId === profileId
          );
          callback(localTemplates);
        }
      );
    } catch (error) {
      console.warn('Failed to subscribe to Firestore, using localStorage:', error);
    }
  }

  // Fallback: use localStorage with custom event listener
  const handleStorageChange = (event: Event) => {
    const customEvent = event as CustomEvent<ProfileTemplate[]>;
    if (customEvent.detail) {
      callback(customEvent.detail.filter((t) => t.profileId === profileId));
    } else {
      const localTemplates = getLocalProfileTemplates().filter(
        (t) => t.profileId === profileId
      );
      callback(localTemplates);
    }
  };

  // Initial callback with current templates
  const localTemplates = getLocalProfileTemplates().filter((t) => t.profileId === profileId);
  callback(localTemplates);

  // Listen for changes
  window.addEventListener('profileTemplatesStorageChange', handleStorageChange);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('profileTemplatesStorageChange', handleStorageChange);
  };
}
