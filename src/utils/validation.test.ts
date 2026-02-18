/**
 * Tests for shared validation utilities
 */

import { describe, it, expect } from 'vitest';
import { EMAIL_REGEX } from './validation';

describe('EMAIL_REGEX', () => {
  it('matches valid email addresses', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('name.last@domain.org')).toBe(true);
    expect(EMAIL_REGEX.test('user+tag@example.co.uk')).toBe(true);
    expect(EMAIL_REGEX.test('a@b.c')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(EMAIL_REGEX.test('')).toBe(false);
    expect(EMAIL_REGEX.test('notanemail')).toBe(false);
    expect(EMAIL_REGEX.test('@missing-local.com')).toBe(false);
    expect(EMAIL_REGEX.test('missing-domain@')).toBe(false);
    expect(EMAIL_REGEX.test('has space@example.com')).toBe(false);
  });
});
