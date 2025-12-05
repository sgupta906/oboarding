/**
 * Seed Test Users for Firebase Emulator
 *
 * This script creates test user accounts in the Firebase Authentication emulator
 * and sets up their corresponding Firestore user documents with role information.
 *
 * Usage:
 *   npm run seed:test-users
 *
 * Prerequisites:
 *   - Firebase emulator must be running (npm run firebase:emulator)
 *   - .env.local must be configured with Firebase project details
 *
 * Test Users Created:
 *   - test-employee@example.com (role: employee)
 *   - test-manager@example.com (role: manager)
 *   - test-admin@example.com (role: admin)
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import * as dotenv from 'dotenv';
import type { UserRole } from '../src/config/authTypes';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_AUTH_EMULATOR_HOST',
  'VITE_FIRESTORE_EMULATOR_HOST',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Connect to emulators
const authHost = process.env.VITE_AUTH_EMULATOR_HOST || 'http://127.0.0.1:9099';
const firestoreHost = process.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

connectAuthEmulator(auth, authHost);
connectFirestoreEmulator(
  firestore,
  firestoreHost.split(':')[0],
  parseInt(firestoreHost.split(':')[1], 10)
);

// Test user definitions
interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  description: string;
}

const testUsers: TestUser[] = [
  {
    email: 'test-employee@example.com',
    password: 'TestEmployee123!',
    role: 'employee',
    description: 'Test employee account for onboarding workflow',
  },
  {
    email: 'test-manager@example.com',
    password: 'TestManager123!',
    role: 'manager',
    description: 'Test manager account for dashboard access',
  },
  {
    email: 'test-admin@example.com',
    password: 'TestAdmin123!',
    role: 'admin',
    description: 'Test admin account with full system access',
  },
];

async function seedTestUsers(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Starting test user seeding...\n');

  for (const testUser of testUsers) {
    try {
      // eslint-disable-next-line no-console
      console.log(`Creating user: ${testUser.email} (${testUser.role})...`);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testUser.email,
        testUser.password
      );

      const uid = userCredential.user.uid;
      // eslint-disable-next-line no-console
      console.log(`  ✓ Auth user created with UID: ${uid}`);

      // Create Firestore user document
      const userRef = doc(firestore, 'users', uid);
      const now = Timestamp.now();

      await setDoc(userRef, {
        uid,
        email: testUser.email,
        name: testUser.email.split('@')[0],
        role: testUser.role,
        roles: [testUser.role],
        profiles: [],
        createdAt: now.toMillis(),
        updatedAt: now.toMillis(),
        createdBy: 'emulator-seed-script',
      }, { merge: true });

      // eslint-disable-next-line no-console
      console.log(`  ✓ Firestore user document created`);
      // eslint-disable-next-line no-console
      console.log(`  📝 Role: ${testUser.role}`);
      // eslint-disable-next-line no-console
      console.log(`  📝 Description: ${testUser.description}\n`);
    } catch (error) {
      // Handle error if user already exists or other Firebase error
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          // eslint-disable-next-line no-console
          console.log(`  ⚠️  User already exists (skipping)\n`);
        } else {
          // eslint-disable-next-line no-console
          console.error(`  ✗ Error creating user: ${error.message}\n`);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(`  ✗ Unknown error creating user\n`);
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log('Test user seeding complete!');
  // eslint-disable-next-line no-console
  console.log('\nYou can now sign in with:');
  for (const testUser of testUsers) {
    // eslint-disable-next-line no-console
    console.log(`  - ${testUser.email} (${testUser.role})`);
  }
  // eslint-disable-next-line no-console
  console.log('\nFirebase Emulator UI: http://localhost:4000');

  process.exit(0);
}

// Run the seeding
seedTestUsers().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
