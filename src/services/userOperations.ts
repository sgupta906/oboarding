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

/**
 * Gets users from localStorage, initializing with defaults if empty
 */
function getLocalUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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
 */
function saveLocalUsers(users: User[]): void {
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
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  const localUsers = getLocalUsers();
  const userId = `local-user-${Date.now()}`;
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
 * Deletes a user
 */
export async function deleteUser(userId: string): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  const localUsers = getLocalUsers();
  const filteredUsers = localUsers.filter((u) => u.id !== userId);
  saveLocalUsers(filteredUsers);
}

/**
 * Subscribes to real-time updates of all users
 *
 * IMPORTANT: This function ALWAYS sets up a localStorage event listener
 * in addition to any Firestore subscription. This ensures that:
 * 1. Users created via the UI (which use localStorage) trigger updates
 * 2. The UI stays in sync even when Firestore is unavailable
 *
 * The localStorage listener takes precedence when available to avoid
 * race conditions between Firestore and localStorage data sources.
 */
export function subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
  let firestoreUnsubscribe: Unsubscribe | null = null;
  let lastEmittedUsers: User[] | null = null;

  // Always set up localStorage listener for local changes
  const handleStorageChange = (event: Event) => {
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
          const users = snapshot.docs.map((d) =>
            normalizeUserData(d.data() as Partial<User>, d.id)
          );
          // Only emit Firestore data if it has users AND we haven't just emitted localStorage data
          // This prevents race conditions where localStorage saves are overridden by Firestore listeners
          if (users.length > 0) {
            lastEmittedUsers = users;
            callback(users);
          } else {
            // Firestore is empty, use localStorage
            const localUsers = getLocalUsers();
            // Only emit if we haven't just emitted these same users
            if (lastEmittedUsers !== localUsers) {
              lastEmittedUsers = localUsers;
              callback(localUsers);
            }
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
