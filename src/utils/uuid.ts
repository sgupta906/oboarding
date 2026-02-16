/**
 * UUID validation and dev-auth UUID generation utilities.
 *
 * Centralizes UUID format checking and deterministic dev-auth ID
 * generation so every service and auth path uses the same logic.
 */

/** Regex for UUID format validation (v1-v5, any 8-4-4-4-12 hex pattern) */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a string is a valid UUID format.
 * Works with UUID v1-v5 formats (any 8-4-4-4-12 hex pattern).
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Deterministic UUIDs for the 3 built-in test accounts.
 * These are valid UUID v4-format strings that never collide with
 * real Supabase-generated UUIDs (which use crypto.randomUUID).
 *
 * Format: 00000000-0000-4000-a000-00000000000N
 * - Version nibble = 4 (UUID v4)
 * - Variant bits = 10 (RFC 4122)
 */
export const DEV_AUTH_UUIDS: Record<string, string> = {
  'test-employee@example.com': '00000000-0000-4000-a000-000000000001',
  'test-manager@example.com': '00000000-0000-4000-a000-000000000002',
  'test-admin@example.com': '00000000-0000-4000-a000-000000000003',
};

/**
 * Returns the deterministic dev-auth UUID for a known test email,
 * or generates a fallback UUID using crypto.randomUUID() for unknown emails.
 */
export function getDevAuthUUID(email: string): string {
  const normalized = email.toLowerCase().trim();
  return DEV_AUTH_UUIDS[normalized] ?? crypto.randomUUID();
}
