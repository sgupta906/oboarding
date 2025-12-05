/**
 * Global test setup file for Vitest
 * Runs before all tests
 */

import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';

/**
 * Mock window.matchMedia for dark mode context tests
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Create localStorage mock factory
 */
function createLocalStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
}

/**
 * Default Firebase environment for tests
 * Individual tests can override these values before importing modules
 * This prevents cross-test pollution from Firebase Emulator
 */
if (typeof import.meta !== 'undefined') {
  // Only set if not already set by individual tests
  if (!((import.meta.env as any).VITE_USE_FIREBASE_EMULATOR)) {
    (import.meta.env as any).VITE_USE_FIREBASE_EMULATOR = 'false';
  }
  if (!((import.meta.env as any).VITE_FIREBASE_PROJECT_ID)) {
    (import.meta.env as any).VITE_FIREBASE_PROJECT_ID = '';
  }
}

vi.stubGlobal('localStorage', createLocalStorageMock());

/**
 * Reset localStorage before each test
 */
beforeEach(() => {
  // Reset to fresh mock
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', createLocalStorageMock());
});

/**
 * Clean up after each test
 */
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
