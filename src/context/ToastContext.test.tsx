/**
 * ToastContext Tests - Verify toast notification behavior
 * Tests: rendering, show/dismiss, auto-dismiss timing, error types, guard check
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

// Mock crypto.randomUUID
beforeEach(() => {
  let counter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => `test-uuid-${++counter}`,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ToastContext', () => {
  it('renders children inside ToastProvider', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Hello</div>
      </ToastProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('showToast adds a visible toast with correct message', () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Test message', 'info')}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Toast').click();
    });

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('auto-dismisses toast after 4 seconds', () => {
    vi.useFakeTimers();

    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Temporary toast')}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Toast').click();
    });

    expect(screen.getByText('Temporary toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(screen.queryByText('Temporary toast')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('dismiss button removes toast immediately', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Dismissable toast')}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Toast'));

    expect(screen.getByText('Dismissable toast')).toBeInTheDocument();

    const dismissButton = screen.getByLabelText('Dismiss notification');
    await user.click(dismissButton);

    expect(screen.queryByText('Dismissable toast')).not.toBeInTheDocument();
  });

  it('error type renders with rose color classes', () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Error occurred', 'error')}>
          Show Error
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Error').click();
    });

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-rose-600');
  });

  it('useToast throws when used outside ToastProvider', () => {
    // Suppress console.error from React during expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');

    spy.mockRestore();
  });
});
