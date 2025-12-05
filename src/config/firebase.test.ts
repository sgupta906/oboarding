import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firebaseModule from 'firebase/app';
import * as authModule from 'firebase/auth';
import * as firestoreModule from 'firebase/firestore';
import * as storageModule from 'firebase/storage';

describe('Firebase Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should have required Firebase SDK packages installed', () => {
    expect(firebaseModule).toBeDefined();
    expect(authModule).toBeDefined();
    expect(firestoreModule).toBeDefined();
    expect(storageModule).toBeDefined();
  });

  it('should export app, auth, firestore, and storage from config', async () => {
    const config = await import('./firebase');
    expect(config.app).toBeDefined();
    expect(config.auth).toBeDefined();
    expect(config.firestore).toBeDefined();
    expect(config.storage).toBeDefined();
  });

  it('should have required env variables defined', () => {
    expect(import.meta.env.VITE_FIREBASE_PROJECT_ID).toBeDefined();
    expect(import.meta.env.VITE_FIREBASE_API_KEY).toBeDefined();
  });
});
