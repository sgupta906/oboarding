/**
 * Unit tests for subscriptionManager utility
 * Tests shared subscription with reference counting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createSharedSubscription } from './subscriptionManager';

type SubscribeFn<T> = (callback: (data: T) => void) => () => void;

describe('createSharedSubscription', () => {
  let subscribeFn: SubscribeFn<string[]>;
  let cleanupFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanupFn = vi.fn();
    subscribeFn = vi.fn((callback: (data: string[]) => void) => {
      // Simulate initial data delivery
      callback(['item-1', 'item-2']);
      return cleanupFn as unknown as () => void;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call subscribeFn on first subscriber', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback = vi.fn();

    shared.subscribe(callback);

    expect(subscribeFn).toHaveBeenCalledTimes(1);
  });

  it('should NOT call subscribeFn again for second subscriber', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    shared.subscribe(callback1);
    shared.subscribe(callback2);

    expect(subscribeFn).toHaveBeenCalledTimes(1);
  });

  it('should deliver initial data to first subscriber', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback = vi.fn();

    shared.subscribe(callback);

    expect(callback).toHaveBeenCalledWith(['item-1', 'item-2']);
  });

  it('should deliver cached lastData immediately to new subscriber', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    shared.subscribe(callback1);
    // callback1 got ['item-1', 'item-2'] from initial subscribeFn delivery
    // Now subscribe a second callback - it should get cached data immediately
    shared.subscribe(callback2);

    expect(callback2).toHaveBeenCalledWith(['item-1', 'item-2']);
  });

  it('should broadcast new data to all subscribers', () => {
    let broadcastCallback: ((data: string[]) => void) | null = null;
    const customSubscribeFn: SubscribeFn<string[]> = vi.fn((callback: (data: string[]) => void) => {
      broadcastCallback = callback;
      callback(['initial']);
      return cleanupFn as unknown as () => void;
    });

    const shared = createSharedSubscription('test-key', customSubscribeFn);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    shared.subscribe(callback1);
    shared.subscribe(callback2);

    // Simulate new data arriving from upstream
    broadcastCallback!(['new-item-1', 'new-item-2']);

    expect(callback1).toHaveBeenCalledWith(['new-item-1', 'new-item-2']);
    expect(callback2).toHaveBeenCalledWith(['new-item-1', 'new-item-2']);
  });

  it('should decrement ref count on unsubscribe without calling cleanup', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsub1 = shared.subscribe(callback1);
    shared.subscribe(callback2);

    // Unsubscribe first - should NOT call cleanup (second still active)
    unsub1();

    expect(cleanupFn).not.toHaveBeenCalled();
  });

  it('should call underlying cleanup when last subscriber unsubscribes', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsub1 = shared.subscribe(callback1);
    const unsub2 = shared.subscribe(callback2);

    unsub1();
    expect(cleanupFn).not.toHaveBeenCalled();

    unsub2();
    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it('should create fresh subscription after full cleanup', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback1 = vi.fn();

    const unsub1 = shared.subscribe(callback1);
    unsub1(); // Full cleanup

    expect(subscribeFn).toHaveBeenCalledTimes(1);

    // Subscribe again after full cleanup
    const callback2 = vi.fn();
    shared.subscribe(callback2);

    expect(subscribeFn).toHaveBeenCalledTimes(2);
  });

  it('should isolate callbacks - unsubscribed callback should not receive new data', () => {
    let broadcastCallback: ((data: string[]) => void) | null = null;
    const customSubscribeFn: SubscribeFn<string[]> = vi.fn((callback: (data: string[]) => void) => {
      broadcastCallback = callback;
      callback(['initial']);
      return cleanupFn as unknown as () => void;
    });

    const shared = createSharedSubscription('test-key', customSubscribeFn);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsub1 = shared.subscribe(callback1);
    shared.subscribe(callback2);

    // Unsubscribe callback1
    unsub1();

    // Clear call history
    callback1.mockClear();
    callback2.mockClear();

    // Broadcast new data
    broadcastCallback!(['updated']);

    // callback1 should NOT receive the update
    expect(callback1).not.toHaveBeenCalled();
    // callback2 should still receive it
    expect(callback2).toHaveBeenCalledWith(['updated']);
  });

  it('should handle double unsubscribe gracefully', () => {
    const shared = createSharedSubscription('test-key', subscribeFn);
    const callback = vi.fn();

    const unsub = shared.subscribe(callback);
    unsub();
    // Double unsubscribe should not throw or call cleanup again
    unsub();

    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it('should work with different data types', () => {
    interface TestItem {
      id: string;
      name: string;
    }

    const typedSubscribeFn: SubscribeFn<TestItem[]> = vi.fn((callback: (data: TestItem[]) => void) => {
      callback([{ id: '1', name: 'Test' }]);
      return (() => {}) as () => void;
    });

    const shared = createSharedSubscription<TestItem[]>('typed-key', typedSubscribeFn);
    const callback = vi.fn();

    shared.subscribe(callback);

    expect(callback).toHaveBeenCalledWith([{ id: '1', name: 'Test' }]);
  });
});
