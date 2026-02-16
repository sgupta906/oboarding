import { describe, it, expect } from 'vitest';
import { isValidUUID, DEV_AUTH_UUIDS, getDevAuthUUID } from './uuid';

describe('isValidUUID', () => {
  it('accepts a standard UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts an uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects the old dev-auth format (test-test-manager)', () => {
    expect(isValidUUID('test-test-manager')).toBe(false);
  });

  it('rejects a base64 emailHash (the old fallback format)', () => {
    expect(isValidUUID('dGVzdC1lbXBsb3ll')).toBe(false);
  });

  it('rejects a truncated UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });
});

describe('DEV_AUTH_UUIDS', () => {
  it('has exactly 3 entries for the test emails', () => {
    const keys = Object.keys(DEV_AUTH_UUIDS);
    expect(keys).toHaveLength(3);
    expect(keys).toContain('test-employee@example.com');
    expect(keys).toContain('test-manager@example.com');
    expect(keys).toContain('test-admin@example.com');
  });

  it('all values are valid UUIDs', () => {
    for (const uuid of Object.values(DEV_AUTH_UUIDS)) {
      expect(isValidUUID(uuid)).toBe(true);
    }
  });
});

describe('getDevAuthUUID', () => {
  it('returns correct UUID for test-employee', () => {
    expect(getDevAuthUUID('test-employee@example.com')).toBe(
      '00000000-0000-4000-a000-000000000001',
    );
  });

  it('returns correct UUID for test-manager', () => {
    expect(getDevAuthUUID('test-manager@example.com')).toBe(
      '00000000-0000-4000-a000-000000000002',
    );
  });

  it('returns correct UUID for test-admin', () => {
    expect(getDevAuthUUID('test-admin@example.com')).toBe(
      '00000000-0000-4000-a000-000000000003',
    );
  });

  it('returns a valid UUID for an unknown email (fallback)', () => {
    const result = getDevAuthUUID('unknown@example.com');
    expect(isValidUUID(result)).toBe(true);
    // Should NOT be one of the hardcoded UUIDs
    expect(Object.values(DEV_AUTH_UUIDS)).not.toContain(result);
  });

  it('normalizes email case and whitespace', () => {
    expect(getDevAuthUUID('  Test-Manager@Example.COM  ')).toBe(
      '00000000-0000-4000-a000-000000000002',
    );
  });
});
