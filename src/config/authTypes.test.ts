/**
 * Unit tests for hasManagerAccess() helper
 * Verifies that custom roles get manager-level access
 * while 'employee' and null do not.
 */

import { describe, it, expect } from 'vitest';
import { hasManagerAccess } from './authTypes';

describe('hasManagerAccess', () => {
  it('returns false for null', () => {
    expect(hasManagerAccess(null)).toBe(false);
  });

  it('returns false for "employee"', () => {
    expect(hasManagerAccess('employee')).toBe(false);
  });

  it('returns true for "manager"', () => {
    expect(hasManagerAccess('manager')).toBe(true);
  });

  it('returns true for "admin"', () => {
    expect(hasManagerAccess('admin')).toBe(true);
  });

  it('returns true for custom role "team-lead"', () => {
    expect(hasManagerAccess('team-lead')).toBe(true);
  });

  it('returns true for custom role "hr-admin"', () => {
    expect(hasManagerAccess('hr-admin')).toBe(true);
  });

  it('returns true for custom role "talker"', () => {
    expect(hasManagerAccess('talker')).toBe(true);
  });

  it('returns true for empty string (edge case: non-null, non-employee)', () => {
    expect(hasManagerAccess('')).toBe(true);
  });
});
