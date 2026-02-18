/**
 * Tests for shared formatting utilities
 */

import { describe, it, expect } from 'vitest';
import { getInitials } from './formatters';

describe('getInitials', () => {
  it('returns two initials for a two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns one initial for a single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns at most 2 characters for three+ word names', () => {
    expect(getInitials('Jane Mary Smith')).toBe('JM');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('uppercases lowercase names', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});
