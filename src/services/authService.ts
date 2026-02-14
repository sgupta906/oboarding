/**
 * Authentication Service
 * Handles user authentication, role management, and Firestore user operations
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import type { AuthUser, UserRole, FirestoreUser } from '../config/authTypes';
import { getAuthCredential } from './supabase';

/**
 * Maps test emails to their predefined roles for mock sign-in
 * In production, roles would come from a proper auth provider or admin console
 */
const MOCK_EMAIL_ROLES: Record<string, UserRole> = {
  'test-employee@example.com': 'employee',
  'test-manager@example.com': 'manager',
  'test-admin@example.com': 'admin',
};

/**
 * Creates or updates a Firestore user document with role information
 * Security: Should be called only from secure backend or Auth.js server action
 *
 * @param uid - User's unique identifier from Firebase Auth
 * @param email - User's email address
 * @param role - User's role (employee, manager, or admin)
 * @returns Promise that resolves when user document is saved
 * @throws Error if Firestore operation fails
 */
export async function setUserRole(
  uid: string,
  email: string,
  role: UserRole,
): Promise<void> {
  try {
    const now = Timestamp.now();
    const userRef = doc(firestore, 'users', uid);

    // Check if user document exists
    const userDoc = await getDoc(userRef);

    const userData: FirestoreUser = {
      uid,
      email,
      role,
      createdAt: userDoc.exists()
        ? (userDoc.data() as FirestoreUser).createdAt
        : now.toMillis(),
      updatedAt: now.toMillis(),
    };

    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}

/**
 * Retrieves a user's role from Firestore
 * Security: Verify user owns this document via Firestore security rules
 *
 * @param uid - User's unique identifier
 * @returns Promise resolving to user's role or null if not found
 * @throws Error if Firestore operation fails
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn(`User document not found for uid: ${uid}`);
      return null;
    }

    const userData = userDoc.data() as FirestoreUser;
    return userData.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    // Return null on error instead of throwing to handle gracefully
    return null;
  }
}

/**
 * Gets the currently authenticated user with their role
 * Requires user to be authenticated
 *
 * @returns Promise resolving to AuthUser or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      return null;
    }

    const role = await getUserRole(currentUser.uid);

    if (!role) {
      return null;
    }

    return {
      uid: currentUser.uid,
      email: currentUser.email,
      role,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Mock sign-in with email link (stubbed for demo)
 * In production, this would send an actual email link via Firebase
 * For testing, we use predefined test emails with hardcoded roles
 *
 * This implementation uses a hybrid approach:
 * 1. Validates email against test email list
 * 2. Attempts Firebase Auth creation (may fail if emulator not running)
 * 3. Falls back to localStorage mock for development without emulator
 * 4. Stores user role in Firestore or localStorage
 *
 * Security considerations:
 * - Real implementation should use Firebase's email link authentication
 * - Link should be time-limited (typically 24 hours)
 * - Server should verify the email belongs to the user claiming it
 * - Never return sensitive data that reveals system structure
 *
 * @param email - User's email address
 * @returns Promise that resolves when sign-in is processed
 * @throws Error if sign-in fails
 */
export async function signInWithEmailLink(email: string): Promise<void> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address');
    }

    const trimmedEmail = email.trim().toLowerCase();

    // First, check if this user was created via the Users panel
    const dynamicCredential = getAuthCredential(trimmedEmail);
    if (dynamicCredential) {
      // User was created via Users panel - use their stored credentials
      localStorage.setItem(
        'mockAuthUser',
        JSON.stringify({
          uid: dynamicCredential.uid,
          email: dynamicCredential.email,
          role: dynamicCredential.role,
        })
      );

      // Notify AuthProvider so it can pick up the auth change immediately
      window.dispatchEvent(
        new CustomEvent('authStorageChange', {
          detail: { key: 'mockAuthUser' },
        })
      );

      console.log(`[Auth] Signed in as ${trimmedEmail} (${dynamicCredential.role}) - created via Users panel`);
      return;
    }

    // Determine role from mock email mapping (fallback for test accounts)
    const mockRole = MOCK_EMAIL_ROLES[trimmedEmail];

    if (!mockRole) {
      throw new Error(
        'Email not recognized. Use test-employee@example.com, test-manager@example.com, test-admin@example.com, or create a user in the Users panel.',
      );
    }

    // Generate a deterministic UID from email for consistency
    const emailHash = btoa(trimmedEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    let uid: string;
    let useFirebaseAuth = true;

    try {
      // Try to create a new user with the test email
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        'mockPassword123!',
      );
      uid = userCredential.user.uid;
    } catch (authError: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorCode = authError instanceof Error ? (authError as any).code : '';

      if (errorCode === 'auth/email-already-in-use') {
        // Existing user: sign in with the known mock password so auth state updates
        try {
          const existingCredential = await signInWithEmailAndPassword(
            auth,
            trimmedEmail,
            'mockPassword123!',
          );
          uid = existingCredential.user.uid;
        } catch (signinError) {
          // Couldn't sign in (emulator offline, etc.) – fall back to local storage
          useFirebaseAuth = false;
          uid = emailHash;
          console.warn('Firebase Auth sign-in unavailable, using localStorage fallback:', signinError);
        }
      } else if (
        errorCode.includes('network-request-failed') ||
        errorCode.includes('app-not-initialized')
      ) {
        // Emulator not running or Firebase not initialized
        // Use localStorage fallback for development
        useFirebaseAuth = false;
        uid = emailHash;
        console.warn(
          'Firebase Auth unavailable, using localStorage fallback. Start emulator with: npm run firebase:emulator'
        );
      } else {
        throw authError;
      }
    }

    // Store user in Firestore or localStorage
    if (useFirebaseAuth) {
      try {
        await setUserRole(uid, trimmedEmail, mockRole);
      } catch (firestoreError) {
        console.warn('Firestore write failed, using localStorage:', firestoreError);
        useFirebaseAuth = false;
      }
    }

    if (!useFirebaseAuth) {
      // Use localStorage for development without emulator
      localStorage.setItem(
        'mockAuthUser',
        JSON.stringify({ uid, email: trimmedEmail, role: mockRole })
      );

      // Notify AuthProvider so it can pick up the mock auth change immediately
      window.dispatchEvent(
        new CustomEvent('authStorageChange', {
          detail: { key: 'mockAuthUser' },
        })
      );
    }
  } catch (error) {
    console.error('Error signing in with email link:', error);
    throw error;
  }
}

/**
 * Signs out the currently authenticated user
 * Clears auth state from Firebase and localStorage fallback
 *
 * Security: Does not require additional authorization
 * User can always sign themselves out
 *
 * @returns Promise that resolves when sign-out is complete
 * @throws Error if sign-out fails
 */
export async function signOut(): Promise<void> {
  try {
    // Clear localStorage mock auth
    localStorage.removeItem('mockAuthUser');

    // Dispatch custom event to notify AuthProvider of logout (for same-tab updates)
    window.dispatchEvent(
      new CustomEvent('authStorageChange', {
        detail: { key: 'mockAuthUser' },
      }),
    );

    // Try to sign out from Firebase (may fail if emulator not running)
    try {
      await firebaseSignOut(auth);
    } catch (firebaseError) {
      console.warn('Firebase sign-out failed (emulator may not be running):', firebaseError);
      // Continue - localStorage is already cleared
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
