/**
 * Global test setup file for Vitest
 * Runs before all tests
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

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
 * Clean up after each test
 */
afterEach(() => {
  vi.clearAllMocks();
});
