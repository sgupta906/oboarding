/**
 * User Operations for OnboardingHub
 * Handles user CRUD operations with localStorage fallback
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
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User, Activity } from '../types';

const USERS_COLLECTION = 'users';
const USERS_STORAGE_KEY = 'onboardinghub_users';
const ONBOARDING_INSTANCES_STORAGE_KEY = 'onboardinghub_onboarding_instances';

function normalizeUserData(raw: Partial<User> & { role?: string }, id: string): User {
  const rolesArray = Array.isArray(raw.roles)
    ? raw.roles
    : raw.role
      ? [raw.role]
      : [];

  const profilesArray = Array.isArray(raw.profiles)
    ? raw.profiles
    : raw.profiles
      ? [raw.profiles]
      : [];

  return {
    id,
    email: raw.email ?? '',
    name: raw.name ?? raw.email ?? 'Unknown User',
    roles: rolesArray,
    profiles: profilesArray,
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? Date.now(),
    createdBy: raw.createdBy ?? 'system',
  };
}

// Default users to pre-seed when no users exist
const DEFAULT_USERS: Omit<User, 'id'>[] = [
  {
    email: 'admin@company.com',
    name: 'System Admin',
    roles: ['admin'],
    profiles: ['All'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  },
  {
    email: 'manager@company.com',
    name: 'Team Manager',
    roles: ['manager'],
    profiles: ['Engineering', 'Sales'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  },
  {
    email: 'employee@company.com',
    name: 'Test Employee',
    roles: ['employee'],
    profiles: ['Engineering'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  },
];

/**
 * Checks if Firebase/Firestore is available and working
 */
function isFirestoreAvailable(): boolean {
  try {
    const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
    const hasConfig = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
    return useEmulator || hasConfig;
  } catch {
    return false;
  }
}

const TEST_MODE_FLAG = '__TEST_DISABLE_DEFAULT_SEEDING__';

/**
 * Gets users from localStorage, initializing with defaults if empty
 * Respects test mode flag for test isolation
 */
function getLocalUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Skip seeding if in test mode (flag set via setDisableDefaultUserSeeding)
    const testModeEnabled = localStorage.getItem(TEST_MODE_FLAG) === 'true';
    if (testModeEnabled) {
      return [];
    }

    // Initialize with default users
    const defaultUsersWithIds = DEFAULT_USERS.map((user, index) => ({
      ...user,
      id: `local-user-${index + 1}`,
    }));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsersWithIds));
    return defaultUsersWithIds;
  } catch {
    return [];
  }
}

/**
 * Saves users to localStorage and dispatches a custom event to notify subscribers
 * @internal Exported for testing purposes (test helper)
 */
export function saveLocalUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('usersStorageChange', { detail: users }));
  } catch (error) {
    console.error('Failed to save users to localStorage:', error);
  }
}

/**
 * Checks if a user email already exists (case-insensitive)
 * Security: Prevents duplicate email addresses
 */
export async function userEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  if (isFirestoreAvailable()) {
    try {
      const usersRef = collection(firestore, USERS_COLLECTION);
      const snapshot = await getDocs(usersRef);

      const exists = snapshot.docs.some((d) => {
        const user = normalizeUserData(d.data() as Partial<User>, d.id);
        const isMatch = user.email.toLowerCase() === normalizedEmail;
        return isMatch && (!excludeUserId || d.id !== excludeUserId);
      });

      return exists;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  const localUsers = getLocalUsers();
  return localUsers.some(
    (u) => u.email.toLowerCase() === normalizedEmail && (!excludeUserId || u.id !== excludeUserId)
  );
}

/**
 * Fetches all users
 */
export async function listUsers(): Promise<User[]> {
  if (isFirestoreAvailable()) {
    try {
      const usersRef = collection(firestore, USERS_COLLECTION);
      const snapshot = await getDocs(usersRef);
      const firestoreUsers = snapshot.docs.map((d) =>
        normalizeUserData(d.data() as Partial<User>, d.id)
      );

      if (firestoreUsers.length > 0) {
        return firestoreUsers;
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  return getLocalUsers();
}

/**
 * Fetches a single user by ID
 */
export async function getUser(id: string): Promise<User | null> {
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return normalizeUserData(docSnap.data() as Partial<User>, docSnap.id);
      }
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  const localUsers = getLocalUsers();
  return localUsers.find((u) => u.id === id) || null;
}

/**
 * Creates a new user
 * @throws Error if email already exists
 *
 * IMPORTANT: Also adds the user to the auth credential storage so they can sign in.
 * In development mode (localStorage), this creates a sign-in credential for the user.
 */
export async function createUser(
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<User> {
  const emailExists = await userEmailExists(userData.email);
  if (emailExists) {
    throw new Error(`A user with email ${userData.email} already exists`);
  }

  const now = Date.now();
  const trimmedEmail = userData.email.toLowerCase().trim();
  const trimmedName = userData.name.trim();

  // Determine the primary role for auth (first role or 'employee')
  const primaryRole = userData.roles[0] || 'employee';

  if (isFirestoreAvailable()) {
    try {
      const usersRef = collection(firestore, USERS_COLLECTION);
      const docRef = await addDoc(usersRef, {
        email: trimmedEmail,
        name: trimmedName,
        roles: userData.roles,
        profiles: userData.profiles,
        createdAt: now,
        updatedAt: now,
        createdBy,
      });

      // Note: In production with Firebase Auth, you would create the auth user here
      // For now, also add to localStorage auth credentials for development
      addUserToAuthCredentials(trimmedEmail, primaryRole, docRef.id);

      return {
        id: docRef.id,
        email: trimmedEmail,
        name: trimmedName,
        roles: userData.roles,
        profiles: userData.profiles ?? [],
        createdAt: now,
        updatedAt: now,
        createdBy,
      };
    } catch (error) {
      console.warn('Firestore creation failed, using localStorage fallback:', error);
      // CRITICAL: Continue to localStorage fallback only if Firestore creation failed
      // Do not fall through from a successful Firestore creation
    }
  }

  // CRITICAL FIX: Only use localStorage if Firestore was not available or failed
  // This prevents duplicate user creation when Firestore is available
  const localUsers = getLocalUsers();
  const userId = `local-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newUser: User = {
    id: userId,
    email: trimmedEmail,
    name: trimmedName,
    roles: userData.roles,
    profiles: userData.profiles ?? [],
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
  saveLocalUsers([...localUsers, newUser]);

  // Add user to auth credentials so they can sign in
  addUserToAuthCredentials(trimmedEmail, primaryRole, userId);

  return newUser;
}

/**
 * Auth credentials storage key for development
 */
const AUTH_CREDENTIALS_KEY = 'onboardinghub_auth_credentials';

/**
 * Adds a user to the auth credentials storage so they can sign in
 * This is for development mode only - production would use Firebase Auth
 *
 * @param email - User's email address
 * @param role - User's role (employee, manager, admin)
 * @param userId - User's unique identifier
 */
export function addUserToAuthCredentials(email: string, role: string, userId: string): void {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    const credentials = stored ? JSON.parse(stored) : [];

    // Check if user already exists in credentials
    const existingIndex = credentials.findIndex(
      (cred: { email: string }) => cred.email.toLowerCase() === email.toLowerCase()
    );

    const userCredential = {
      email: email.toLowerCase(),
      role,
      uid: userId,
    };

    if (existingIndex >= 0) {
      // Update existing credential
      credentials[existingIndex] = userCredential;
    } else {
      // Add new credential
      credentials.push(userCredential);
    }

    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to add user to auth credentials:', error);
  }
}

/**
 * Gets the auth credential for a user by email
 * Used by the sign-in flow to authenticate users created via the UI
 */
export function getAuthCredential(email: string): { email: string; role: string; uid: string } | null {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    if (!stored) return null;

    const credentials = JSON.parse(stored);
    return credentials.find(
      (cred: { email: string }) => cred.email.toLowerCase() === email.toLowerCase()
    ) || null;
  } catch {
    return null;
  }
}

/**
 * Removes a user from auth credentials storage
 * CRITICAL SECURITY: Called during user deletion to prevent orphaned authentication data
 *
 * Without this cleanup:
 * - Deleted users could still authenticate using old credentials
 * - Auth data becomes inconsistent with user database
 * - Security risk: stale credentials could grant unauthorized access
 *
 * This function handles corrupted localStorage gracefully by:
 * - Catching JSON parse errors and recovering with an empty array
 * - Verifying credentials array is valid before filtering
 * - Only saving if credentials were actually modified
 *
 * @param email - User's email address to remove from auth credentials
 */
export function removeUserFromAuthCredentials(email: string): void {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    if (!stored) return;

    let credentials: any[] = [];
    try {
      const parsed = JSON.parse(stored);
      // Validate it's an array before proceeding
      if (!Array.isArray(parsed)) {
        console.warn('Invalid auth credentials format (not an array), reinitializing');
        localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify([]));
        return;
      }
      credentials = parsed;
    } catch (parseError) {
      console.warn('Corrupted auth credentials in localStorage, reinitializing:', parseError);
      localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify([]));
      return;
    }

    // Filter out credentials matching this email (case-insensitive)
    const updatedCredentials = credentials.filter(
      (cred: any) => !cred || !cred.email || cred.email.toLowerCase() !== email.toLowerCase()
    );

    // Only save if credentials were actually removed (array changed)
    if (updatedCredentials.length !== credentials.length) {
      localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
    }
  } catch (error) {
    console.error('Failed to remove user from auth credentials:', error);
  }
}

/**
 * Updates an existing user
 * @throws Error if updated email would create a duplicate
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const now = Date.now();

  if (updates.email) {
    const emailExists = await userEmailExists(updates.email, userId);
    if (emailExists) {
      throw new Error(`A user with email ${updates.email} already exists`);
    }
  }

  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);

      const safeUpdates: Record<string, unknown> = { updatedAt: now };

      if (updates.email) {
        safeUpdates.email = updates.email.toLowerCase().trim();
      }
      if (updates.name) {
        safeUpdates.name = updates.name.trim();
      }
      if (updates.roles !== undefined) {
        safeUpdates.roles = updates.roles;
      }
      if (updates.profiles !== undefined) {
        safeUpdates.profiles = updates.profiles;
      }

      await updateDoc(docRef, safeUpdates);
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  const localUsers = getLocalUsers();
  const updatedUsers = localUsers.map((user) => {
    if (user.id === userId) {
      return {
        ...user,
        ...(updates.email && { email: updates.email.toLowerCase().trim() }),
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.roles !== undefined && { roles: updates.roles }),
        ...(updates.profiles !== undefined && { profiles: updates.profiles }),
        updatedAt: now,
      };
    }
    return user;
  });
  saveLocalUsers(updatedUsers);
}

/**
 * Cascading deletion helper: Removes all onboarding instances for a user
 * Called during user deletion to clean up related data
 *
 * @param userEmail - Email of the user whose instances to delete
 * @internal Used by deleteUser() for cascading cleanup
 */
function deleteOnboardingInstancesForUser(userEmail: string): void {
  try {
    const instancesKey = 'onboardinghub_onboarding_instances';
    const instancesStr = localStorage.getItem(instancesKey);
    if (!instancesStr) return;

    const instances = JSON.parse(instancesStr);
    const filtered = instances.filter(
      (instance: any) => instance.employeeEmail.toLowerCase() !== userEmail.toLowerCase()
    );

    // Only save if instances were actually removed
    if (filtered.length !== instances.length) {
      localStorage.setItem(instancesKey, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Failed to delete onboarding instances for user:', error);
  }
}

/**
 * Cascading deletion helper: Removes all suggestions created by a user
 * Called during user deletion to clean up related data
 *
 * @param userEmail - Email of the user whose suggestions to delete
 * @internal Used by deleteUser() for cascading cleanup
 */
function deleteSuggestionsForUser(userEmail: string): void {
  try {
    const suggestionsKey = 'onboardinghub_suggestions';
    const suggestionsStr = localStorage.getItem(suggestionsKey);
    if (!suggestionsStr) return;

    const suggestions = JSON.parse(suggestionsStr);
    const filtered = suggestions.filter(
      (suggestion: any) => suggestion.suggestedBy.toLowerCase() !== userEmail.toLowerCase()
    );

    // Only save if suggestions were actually removed
    if (filtered.length !== suggestions.length) {
      localStorage.setItem(suggestionsKey, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Failed to delete suggestions for user:', error);
  }
}

/**
 * Cascading deletion helper: Removes all activities initiated by a user
 * Called during user deletion to clean up audit trail
 *
 * @param userId - ID of the user whose activities to delete
 * @internal Used by deleteUser() for cascading cleanup
 */
function deleteActivitiesForUser(userId: string): void {
  try {
    const activitiesKey = 'onboardinghub_activities';
    const activitiesStr = localStorage.getItem(activitiesKey);
    if (!activitiesStr) return;

    const activities = JSON.parse(activitiesStr);
    const filtered = activities.filter(
      (activity: any) => activity.userId !== userId
    );

    // Only save if activities were actually removed
    if (filtered.length !== activities.length) {
      localStorage.setItem(activitiesKey, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Failed to delete activities for user:', error);
  }
}

/**
 * Cascading deletion helper: Removes expert assignments for a user
 * Called during user deletion to clean up step expert references
 *
 * @param userEmail - Email of the user whose expert assignments to delete
 * @internal Used by deleteUser() for cascading cleanup
 */
function deleteExpertAssignmentsForUser(userEmail: string): void {
  try {
    const expertKey = 'onboardinghub_experts';
    const expertStr = localStorage.getItem(expertKey);
    if (!expertStr) return;

    const expertAssignments = JSON.parse(expertStr);
    const filtered = expertAssignments.filter(
      (e: any) => e.expertEmail.toLowerCase() !== userEmail.toLowerCase()
    );

    // Only save if assignments were actually removed
    if (filtered.length !== expertAssignments.length) {
      localStorage.setItem(expertKey, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Failed to delete expert assignments for user:', error);
  }
}

/**
 * Cascading deletion helper: Clears createdBy references in templates
 * Sets createdBy to 'system' for templates created by the deleted user
 * Called during user deletion to maintain template validity
 *
 * @param userId - ID of the user to clear from createdBy fields
 * @internal Used by deleteUser() for cascading cleanup
 */
function clearTemplateCreatedByReferences(userId: string): void {
  try {
    const templatesKey = 'onboardinghub_templates';
    const templatesStr = localStorage.getItem(templatesKey);
    if (!templatesStr) return;

    const templates = JSON.parse(templatesStr);
    const updated = templates.map((template: any) => {
      if (template.createdBy === userId) {
        return {
          ...template,
          createdBy: 'system',
        };
      }
      return template;
    });

    // Only save if templates were actually modified
    if (JSON.stringify(templates) !== JSON.stringify(updated)) {
      localStorage.setItem(templatesKey, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to clear template createdBy references:', error);
  }
}

/**
 * Cascading deletion helper: Clears createdBy references in roles
 * Sets createdBy to 'system' for roles created by the deleted user
 * Called during user deletion to maintain role validity
 *
 * @param userId - ID of the user to clear from createdBy fields
 * @internal Used by deleteUser() for cascading cleanup
 */
function clearRoleCreatedByReferences(userId: string): void {
  try {
    const rolesKey = 'onboardinghub_roles';
    const rolesStr = localStorage.getItem(rolesKey);
    if (!rolesStr) return;

    const roles = JSON.parse(rolesStr);
    const updated = roles.map((role: any) => {
      if (role.createdBy === userId) {
        return {
          ...role,
          createdBy: 'system',
        };
      }
      return role;
    });

    // Only save if roles were actually modified
    if (JSON.stringify(roles) !== JSON.stringify(updated)) {
      localStorage.setItem(rolesKey, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to clear role createdBy references:', error);
  }
}

/**
 * Cascading deletion helper: Clears createdBy references in profiles
 * Sets createdBy to 'system' for profiles created by the deleted user
 * Called during user deletion to maintain profile validity
 *
 * @param userId - ID of the user to clear from createdBy fields
 * @internal Used by deleteUser() for cascading cleanup
 */
function clearProfileCreatedByReferences(userId: string): void {
  try {
    const profilesKey = 'onboardinghub_profiles';
    const profilesStr = localStorage.getItem(profilesKey);
    if (!profilesStr) return;

    const profiles = JSON.parse(profilesStr);
    const updated = profiles.map((profile: any) => {
      if (profile.createdBy === userId) {
        return {
          ...profile,
          createdBy: 'system',
        };
      }
      return profile;
    });

    // Only save if profiles were actually modified
    if (JSON.stringify(profiles) !== JSON.stringify(updated)) {
      localStorage.setItem(profilesKey, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to clear profile createdBy references:', error);
  }
}

/**
 * Cascading deletion helper: Clears createdBy references in profile templates
 * Sets createdBy to 'system' for profile templates created by the deleted user
 * Called during user deletion to maintain profile template validity
 *
 * @param userId - ID of the user to clear from createdBy fields
 * @internal Used by deleteUser() for cascading cleanup
 */
function clearProfileTemplateCreatedByReferences(userId: string): void {
  try {
    const profileTemplatesKey = 'onboardinghub_profile_templates';
    const profileTemplatesStr = localStorage.getItem(profileTemplatesKey);
    if (!profileTemplatesStr) return;

    const profileTemplates = JSON.parse(profileTemplatesStr);
    const updated = profileTemplates.map((template: any) => {
      if (template.createdBy === userId) {
        return {
          ...template,
          createdBy: 'system',
        };
      }
      return template;
    });

    // Only save if templates were actually modified
    if (JSON.stringify(profileTemplates) !== JSON.stringify(updated)) {
      localStorage.setItem(profileTemplatesKey, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to clear profile template createdBy references:', error);
  }
}

/**
 * Deletes a user with comprehensive cascading cleanup (Option A: Recommended)
 *
 * SECURITY & DATA INTEGRITY:
 * This implementation uses cascading deletion to completely remove a user from the system.
 * Instead of blocking deletion when dependent data exists, we cascade delete/clean up all
 * related data. This approach:
 *
 * 1. Improves UX - Users can be deleted without manual pre-cleanup
 * 2. Maintains data integrity - No orphaned references remain
 * 3. Prevents security issues - Deleted users don't appear in lookups
 * 4. Preserves audit trail - Uses 'system' placeholder for createdBy fields
 *
 * Cascade cleanup performed:
 * 1. Delete all onboarding instances for the user
 * 2. Delete all suggestions created by the user
 * 3. Delete all activities initiated by the user
 * 4. Delete expert step assignments for the user
 * 5. Clear createdBy references (templates, roles, profiles, profile templates)
 * 6. Remove from auth credentials (prevents orphaned authentication)
 * 7. Delete user record from Firestore/localStorage
 *
 * @param userId - The user ID to delete
 *
 * @example
 * // Delete user and cascade cleanup all related data
 * await deleteUser('user-123');
 * // All instances, suggestions, activities, expert assignments are cleaned up
 */
export async function deleteUser(userId: string): Promise<void> {
  // Step 1: Fetch the user to ensure they exist
  const user = await getUser(userId);
  if (!user) {
    // Gracefully handle deletion of non-existent user (idempotent operation)
    return;
  }

  // Step 2: Cascade delete all dependent data
  // This ensures no orphaned data remains after user deletion
  deleteOnboardingInstancesForUser(user.email);
  deleteSuggestionsForUser(user.email);
  deleteActivitiesForUser(userId);
  deleteExpertAssignmentsForUser(user.email);

  // Step 3: Clear createdBy references in all collections
  // This preserves the document while maintaining audit trail integrity
  // by replacing user ID with 'system' placeholder
  clearTemplateCreatedByReferences(userId);
  clearRoleCreatedByReferences(userId);
  clearProfileCreatedByReferences(userId);
  clearProfileTemplateCreatedByReferences(userId);

  // Step 4: Delete from Firestore if available
  // Cascade cleanup is already done, so Firestore deletion is safe
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);
      await deleteDoc(docRef);
      // Continue to cleanup auth credentials even after Firestore delete
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Step 5: Delete from localStorage
  const localUsers = getLocalUsers();
  const filteredUsers = localUsers.filter((u) => u.id !== userId);
  saveLocalUsers(filteredUsers);

  // Step 6: Clean up auth credentials to prevent orphaned authentication data
  // CRITICAL: Without this cleanup, the user's old credentials remain in localStorage
  // and could be used to authenticate even after the user account is deleted
  removeUserFromAuthCredentials(user.email);
}

/**
 * Deep equality check for User arrays
 * CRITICAL: Prevents infinite update loops in subscribeToUsers
 *
 * Reference equality (===) fails because getLocalUsers() returns a new array
 * instance each time it's called, even if the contents are identical.
 * This helper performs a proper deep comparison of array contents.
 *
 * @param users1 - First array to compare
 * @param users2 - Second array to compare
 * @returns True if arrays contain identical user objects
 */
export function areUsersEqual(users1: User[] | null, users2: User[]): boolean {
  // Null is never equal to a non-empty array
  if (users1 === null) {
    return false;
  }

  // Check length first for quick rejection
  if (users1.length !== users2.length) {
    return false;
  }

  // Deep compare each user object
  return users1.every((user1, index) => {
    const user2 = users2[index];
    return (
      user1.id === user2.id &&
      user1.email === user2.email &&
      user1.name === user2.name &&
      JSON.stringify(user1.roles) === JSON.stringify(user2.roles) &&
      JSON.stringify(user1.profiles) === JSON.stringify(user2.profiles) &&
      user1.createdAt === user2.createdAt &&
      user1.updatedAt === user2.updatedAt &&
      user1.createdBy === user2.createdBy
    );
  });
}

/**
 * Subscribes to real-time updates of all users
 *
 * IMPORTANT: This function ALWAYS sets up a localStorage event listener
 * in addition to any Firestore subscription. This ensures that:
 * 1. Users created via the UI (which use localStorage) trigger updates
 * 2. The UI stays in sync even when Firestore is unavailable
 *
 * RACE CONDITION FIX: Uses deep equality check (areUsersEqual) instead of
 * reference equality to prevent infinite update loops. getLocalUsers() returns
 * a new array instance each time, so === comparison would always be false.
 *
 * The localStorage listener takes precedence when available to avoid
 * race conditions between Firestore and localStorage data sources.
 */
export function subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
  let firestoreUnsubscribe: Unsubscribe | null = null;
  let lastEmittedUsers: User[] | null = null;
  let lastStorageChangeTime = 0;

  // Always set up localStorage listener for local changes
  const handleStorageChange = (event: Event) => {
    lastStorageChangeTime = Date.now();
    const customEvent = event as CustomEvent<User[]>;
    if (customEvent.detail) {
      lastEmittedUsers = customEvent.detail;
      callback(customEvent.detail);
    } else {
      const users = getLocalUsers();
      lastEmittedUsers = users;
      callback(users);
    }
  };

  // Listen for localStorage changes (always active)
  window.addEventListener('usersStorageChange', handleStorageChange);

  // Try Firestore first ONLY if emulator is actually running
  if (isFirestoreAvailable()) {
    try {
      const usersRef = collection(firestore, USERS_COLLECTION);
      firestoreUnsubscribe = onSnapshot(
        usersRef,
        (snapshot) => {
          const firestoreUsers = snapshot.docs.map((d) =>
            normalizeUserData(d.data() as Partial<User>, d.id)
          );

          // CRITICAL FIX: Prevent Firestore from overwriting recent localStorage changes
          // If localStorage was updated within the last 100ms, ignore this Firestore update
          // This prevents race conditions where Firestore subscriptions override user creation in localStorage
          const timeSinceLastStorageChange = Date.now() - lastStorageChangeTime;
          if (timeSinceLastStorageChange < 100) {
            // Ignore Firestore update - localStorage change is more recent
            return;
          }

          // CRITICAL FIX 2: Properly merge users from both sources using Map-based deduplication
          // This is the core bug fix that prevents admins from disappearing.
          //
          // THE PROBLEM:
          // When a new user is created: localStorage has [admin1, admin2, newHire]
          // But Firestore may return [admin1, admin2] (stale/incomplete snapshot)
          // The OLD logic would see Firestore has > 0 users and use ONLY Firestore data
          // Result: newHire disappeared and admins mysteriously vanished from UI
          //
          // THE SOLUTION:
          // 1. Start with ALL localStorage users (they're the most recent)
          // 2. Merge in Firestore users (which are source of truth for auth/persistence)
          // 3. For conflicts: Firestore wins (it's authoritative when both exist)
          // 4. For local-only: localStorage wins (recent local changes are more current)
          //
          // This ensures: admin1, admin2 from Firestore + newHire from localStorage = all 3
          const localUsers = getLocalUsers();

          // Use a Map for deduplication: key is user ID, value is most recent user object
          const mergedUsersMap = new Map<string, User>();

          // Add all local users first (they represent the current state)
          localUsers.forEach(user => {
            mergedUsersMap.set(user.id, user);
          });

          // Overwrite with Firestore users (they're authoritative when both exist)
          // This way, if a user exists in both sources, Firestore's version wins
          // But if a user only exists locally (like newly created), it's preserved
          firestoreUsers.forEach(user => {
            mergedUsersMap.set(user.id, user);
          });

          // Convert Map back to array
          const mergedUsers = Array.from(mergedUsersMap.values());

          // Only emit if the merged data differs from last emitted
          // This prevents infinite loops from the Map-based deduplication
          if (!areUsersEqual(lastEmittedUsers, mergedUsers)) {
            lastEmittedUsers = mergedUsers;
            callback(mergedUsers);
          }
        },
        (error) => {
          console.warn('Firestore subscription error, using localStorage:', error);
          const localUsers = getLocalUsers();
          lastEmittedUsers = localUsers;
          callback(localUsers);
        }
      );
    } catch (error) {
      console.warn('Failed to subscribe to Firestore, using localStorage:', error);
      // Initial callback with localStorage data
      const localUsers = getLocalUsers();
      lastEmittedUsers = localUsers;
      callback(localUsers);
    }
  } else {
    // No Firestore available, use localStorage
    const localUsers = getLocalUsers();
    lastEmittedUsers = localUsers;
    callback(localUsers);
  }

  // Return combined unsubscribe function
  return () => {
    window.removeEventListener('usersStorageChange', handleStorageChange);
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
  };
}

/**
 * TEST HELPER: Enables or disables auto-seeding of DEFAULT_USERS
 * When disabled, getLocalUsers() returns empty array instead of seeding
 *
 * @internal For testing only - not for production use
 * @param disable - If true, prevents DEFAULT_USERS from being seeded
 */
export function setDisableDefaultUserSeeding(disable: boolean): void {
  if (disable) {
    localStorage.setItem(TEST_MODE_FLAG, 'true');
  } else {
    localStorage.removeItem(TEST_MODE_FLAG);
  }
}

/**
 * TEST HELPER: Clears all users from localStorage and auth credentials
 * Used by tests to ensure complete isolation between test cases
 *
 * This is necessary because getLocalUsers() auto-seeds DEFAULT_USERS
 * when localStorage is empty. Tests need to clear both the user list
 * AND prevent auto-seeding to achieve proper test isolation.
 *
 * @internal For testing only - not for production use
 */
export function clearAllUsersForTesting(): void {
  // Disable seeding before clearing
  localStorage.setItem(TEST_MODE_FLAG, 'true');

  localStorage.removeItem(USERS_STORAGE_KEY);
  localStorage.removeItem(AUTH_CREDENTIALS_KEY);
  localStorage.removeItem(ONBOARDING_INSTANCES_STORAGE_KEY);
  localStorage.removeItem('onboardinghub_suggestions');
  localStorage.removeItem('onboardinghub_experts');
  localStorage.removeItem('onboardinghub_activities');
}

/**
 * Logs a user management activity to the activity feed
 * @param activity - Activity data to log
 */
export async function logActivity(
  activity: Omit<Activity, 'id' | 'timestamp'>
): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      const activitiesRef = collection(firestore, 'activities');
      await addDoc(activitiesRef, {
        ...activity,
        timestamp: Date.now(),
      });
      return;
    } catch (error) {
      console.warn('Failed to log activity to Firestore:', error);
    }
  }

  // Fallback: log to localStorage
  try {
    const activitiesKey = 'onboardinghub_activities';
    const stored = localStorage.getItem(activitiesKey);
    const activities = stored ? JSON.parse(stored) : [];

    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      ...activity,
      timestamp: Date.now(),
    };

    activities.push(newActivity);
    localStorage.setItem(activitiesKey, JSON.stringify(activities));
  } catch (error) {
    console.error('Failed to log activity to localStorage:', error);
  }
}
