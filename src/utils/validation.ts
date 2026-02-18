/**
 * Shared validation utilities
 * Centralizes email regex and form error types used across modals and services
 */

/** Email validation regex - matches standard email format */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field-level error map used by form modals */
export interface FieldErrors {
  [key: string]: string;
}
