/**
 * Tests for debounce utility
 * Validates timing behavior, cancellation, argument passing, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call function after the specified delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should batch rapid calls into one execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset the timer on each new call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    debounced(); // Reset timer
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(500);

    expect(fn).not.toHaveBeenCalled();
  });

  it('should pass arguments through correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('arg1', 42, { key: 'value' });

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('arg1', 42, { key: 'value' });
  });

  it('should use the latest arguments when batching calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('first');
    debounced('second');
    debounced('third');

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('should work with different delay values', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use default delay of 300ms when not specified', () => {
    const fn = vi.fn();
    const debounced = debounce(fn);

    debounced();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple independent debounced functions', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const debounced1 = debounce(fn1, 300);
    const debounced2 = debounce(fn2, 300);

    debounced1();
    debounced2();

    vi.advanceTimersByTime(300);

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should cancel safely when no pending call exists', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    // Cancel without any prior call -- should not throw
    expect(() => debounced.cancel()).not.toThrow();

    // Also cancel after the timer has already fired
    debounced();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);

    expect(() => debounced.cancel()).not.toThrow();
  });

  it('should allow new calls after cancel', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced.cancel();

    debounced();
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
