/**
 * Tests for formatTimeAgo utility
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatTimeAgo } from './timeUtils';

describe('formatTimeAgo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty string for undefined input', () => {
    expect(formatTimeAgo(undefined)).toBe('');
  });

  it('returns empty string for 0 input', () => {
    expect(formatTimeAgo(0)).toBe('');
  });

  it('returns "just now" for current timestamp', () => {
    expect(formatTimeAgo(Date.now())).toBe('just now');
  });

  it('returns "just now" for timestamp less than 60 seconds ago', () => {
    expect(formatTimeAgo(Date.now() - 30000)).toBe('just now');
  });

  it('returns "just now" for future timestamps', () => {
    expect(formatTimeAgo(Date.now() + 60000)).toBe('just now');
  });

  it('returns minutes ago for timestamps between 1-59 minutes', () => {
    expect(formatTimeAgo(Date.now() - 300000)).toBe('5m ago');
    expect(formatTimeAgo(Date.now() - 60000)).toBe('1m ago');
    expect(formatTimeAgo(Date.now() - 3540000)).toBe('59m ago');
  });

  it('returns hours ago for timestamps between 1-23 hours', () => {
    expect(formatTimeAgo(Date.now() - 7200000)).toBe('2h ago');
    expect(formatTimeAgo(Date.now() - 3600000)).toBe('1h ago');
    expect(formatTimeAgo(Date.now() - 82800000)).toBe('23h ago');
  });

  it('returns "yesterday" for timestamps between 24-47 hours', () => {
    expect(formatTimeAgo(Date.now() - 90000000)).toBe('yesterday');
    expect(formatTimeAgo(Date.now() - 86400000)).toBe('yesterday');
  });

  it('returns days ago for timestamps older than 2 days', () => {
    expect(formatTimeAgo(Date.now() - 259200000)).toBe('3d ago');
    expect(formatTimeAgo(Date.now() - 172800000)).toBe('2d ago');
    expect(formatTimeAgo(Date.now() - 604800000)).toBe('7d ago');
  });
});
