/**
 * SignInView Integration Tests
 * Tests the sign-in form UI and error handling
 * Verifies that auth errors are properly caught and displayed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, userEvent } from '../test/test-utils';
import { SignInView } from './SignInView';
import { AuthProvider } from '../config/authContext';
import * as authService from '../services/authService';

// Mock the auth service
vi.mock('../services/authService');

// Mock Supabase client for AuthProvider
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
  },
}));

describe('SignInView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Helper to render SignInView wrapped in AuthProvider
   * SignInView uses the useAuth hook, which requires AuthProvider
   */
  function renderSignInView() {
    return render(
      <AuthProvider>
        <SignInView />
      </AuthProvider>,
    );
  }

  describe('Form Submission', () => {
    it('displays error when auth service fails', async () => {
      const user = userEvent.setup();
      const mockError = new Error(
        'Auth service unavailable. Please try again.'
      );
      vi.mocked(authService.signInWithEmailLink).mockRejectedValueOnce(
        mockError
      );

      renderSignInView();

      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', {
        name: /Send Sign-In Link/i,
      });

      await user.type(emailInput, 'test-manager@example.com');
      await user.click(submitButton);

      // Error message should be displayed
      expect(
        screen.getByText(
          /Auth service unavailable\. Please try again\./
        )
      ).toBeInTheDocument();
    });

    it('displays error for unrecognized email', async () => {
      const user = userEvent.setup();
      const mockError = new Error(
        'Email not recognized. Use test-employee@example.com, test-manager@example.com, or test-admin@example.com'
      );
      vi.mocked(authService.signInWithEmailLink).mockRejectedValueOnce(
        mockError
      );

      renderSignInView();

      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', {
        name: /Send Sign-In Link/i,
      });

      await user.type(emailInput, 'unknown@example.com');
      await user.click(submitButton);

      // Error message should show email not recognized
      expect(
        screen.getByText(/Email not recognized/i)
      ).toBeInTheDocument();
    });

    it('disables submit button for invalid email format', async () => {
      const user = userEvent.setup();

      renderSignInView();

      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', {
        name: /Send Sign-In Link/i,
      });

      // Submit button should be disabled without email
      expect(submitButton).toBeDisabled();

      await user.type(emailInput, 'notanemail');

      // Form submission should not be called for invalid email
      await user.click(submitButton);

      // The click should not proceed (button remains disabled due to validation)
      expect(vi.mocked(authService.signInWithEmailLink)).not.toHaveBeenCalled();
    });

    it('shows success message on successful sign-in', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.signInWithEmailLink).mockResolvedValueOnce(
        undefined
      );

      renderSignInView();

      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', {
        name: /Send Sign-In Link/i,
      });

      await user.type(emailInput, 'test-manager@example.com');
      await user.click(submitButton);

      // Success message should be displayed
      expect(screen.getByText(/Sign-in successful!/i)).toBeInTheDocument();
      expect(
        screen.getByText(/You should be redirected shortly/i)
      ).toBeInTheDocument();
    });

    it('dispatches custom storage change event after successful sign-in', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.signInWithEmailLink).mockResolvedValueOnce(
        undefined
      );

      // Spy on dispatchEvent to verify custom event is fired
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      renderSignInView();

      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', {
        name: /Send Sign-In Link/i,
      });

      await user.type(emailInput, 'test-manager@example.com');
      await user.click(submitButton);

      // Custom event should be dispatched to notify AuthProvider of localStorage change
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authStorageChange',
          detail: { key: 'mockAuthUser' },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.signInWithEmailLink).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderSignInView();

      const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
      const submitButton = screen.getByRole('button', {
        name: /Send Sign-In Link/i,
      });

      await user.type(emailInput, 'test-manager@example.com');
      await user.click(submitButton);

      // Form should be disabled during submission
      expect(emailInput.disabled).toBe(true);
      expect(submitButton).toHaveAttribute('disabled');
      expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();
    });
  });

  describe('Test Account Links', () => {
    it('displays all test account options', () => {
      renderSignInView();

      expect(screen.getByText('test-employee@example.com')).toBeInTheDocument();
      expect(screen.getByText('test-manager@example.com')).toBeInTheDocument();
      expect(screen.getByText('test-admin@example.com')).toBeInTheDocument();
    });

    it('shows role badges for test accounts', () => {
      renderSignInView();

      // Multiple instances of badges exist (buttons + labels), so use getAllByText
      const employeeBadges = screen.getAllByText('Employee');
      const managerBadges = screen.getAllByText('Manager');
      const adminBadges = screen.getAllByText('Admin');

      expect(employeeBadges.length).toBeGreaterThan(0);
      expect(managerBadges.length).toBeGreaterThan(0);
      expect(adminBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper label for email input', () => {
      renderSignInView();

      const emailInput = screen.getByLabelText('Email Address');
      expect(emailInput).toBeInTheDocument();
    });

    it('form is keyboard accessible', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.signInWithEmailLink).mockResolvedValueOnce(
        undefined
      );

      renderSignInView();

      // Tab to email input
      await user.tab();
      const emailInput = screen.getByLabelText('Email Address');
      expect(emailInput).toHaveFocus();

      // Type email
      await user.keyboard('test-manager@example.com');

      // Tab to submit button
      await user.tab();
      const submitButton = screen.getByRole('button', {
        name: /Send Sign-In Link/i,
      });
      expect(submitButton).toHaveFocus();

      // Press Enter to submit
      await user.keyboard('{Enter}');

      // Should show success
      expect(screen.getByText(/Sign-in successful!/i)).toBeInTheDocument();
    });
  });
});
