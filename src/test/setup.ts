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
 * Default auth environment for tests
 * DISABLE dev auth for tests to ensure localStorage-only testing
 * This prevents cross-test pollution from a running Supabase instance
 *
 * Tests should use localStorage only - this ensures:
 * - Clean test isolation with no persistent emulator data
 * - Faster test execution
 * - Predictable behavior with our test helper functions
 */
if (typeof import.meta !== 'undefined') {
  // FORCE disable dev auth for tests - we use localStorage exclusively
  (import.meta.env as any).VITE_USE_DEV_AUTH = 'false';
}

/**
 * Create initial mock with test mode already disabled
 */
const initialMock = createLocalStorageMock();
initialMock.setItem('__TEST_DISABLE_DEFAULT_SEEDING__', 'true');
vi.stubGlobal('localStorage', initialMock);

/**
 * Reset localStorage before each test
 */
beforeEach(() => {
  // Reset to fresh mock
  vi.unstubAllGlobals();
  // Create fresh mock with test mode flag already set
  const freshMock = createLocalStorageMock();
  freshMock.setItem('__TEST_DISABLE_DEFAULT_SEEDING__', 'true');
  vi.stubGlobal('localStorage', freshMock);
});

/**
 * Clean up after each test
 */
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
