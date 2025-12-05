import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    const firestoreHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    const authHost = import.meta.env.VITE_AUTH_EMULATOR_HOST || 'http://127.0.0.1:9099';
    const storageHost = import.meta.env.VITE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';

    connectFirestoreEmulator(firestore, firestoreHost.split(':')[0], parseInt(firestoreHost.split(':')[1]));
    connectAuthEmulator(auth, authHost);
    connectStorageEmulator(storage, storageHost.split(':')[0], parseInt(storageHost.split(':')[1]));
  } catch (error) {
    console.warn('Emulator connection error (may already be connected):', error);
  }
}

export { app, auth, firestore, storage };
