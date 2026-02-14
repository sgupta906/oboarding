/**
 * SignInView Component - User authentication page
 * Provides email-based sign-in using Supabase authentication (mocked)
 *
 * Mock emails for testing:
 * - test-employee@example.com → employee role
 * - test-manager@example.com → manager role
 * - test-admin@example.com → admin role
 *
 * After successful sign-in:
 * 1. Dispatches a custom event to notify AuthProvider of localStorage changes
 * 2. AuthProvider updates its state, which triggers the redirect in App.tsx
 * 3. User is automatically redirected to the authenticated view
 */

import { useState, useEffect } from 'react';
import { Mail, AlertCircle, Loader, LogIn } from 'lucide-react';
import { signInWithEmailLink } from '../services/authService';
import { useAuth, impersonateUserForQA } from '../config/authContext';
import type { UserRole } from '../config/authTypes';

interface TestAccountButton {
  email: string;
  role: UserRole;
  label: string;
  color: 'blue' | 'purple' | 'red';
}

const TEST_ACCOUNTS: TestAccountButton[] = [
  {
    email: 'test-employee@example.com',
    role: 'employee',
    label: 'Employee',
    color: 'blue',
  },
  {
    email: 'test-manager@example.com',
    role: 'manager',
    label: 'Manager',
    color: 'purple',
  },
  {
    email: 'test-admin@example.com',
    role: 'admin',
    label: 'Admin',
    color: 'red',
  },
];

const colorStyles = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50',
  purple:
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50',
};

export function SignInView() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmulatorMode] = useState(
    import.meta.env.VITE_USE_DEV_AUTH === 'true'
  );
  const { isAuthenticated } = useAuth();

  /**
   * Effect to trigger redirect after successful sign-in
   * Waits for AuthProvider to detect the authentication state
   * and automatically redirects via App.tsx's AppContent component
   */
  useEffect(() => {
    if (submitted && isAuthenticated) {
      // User is now authenticated, the redirect will happen in App.tsx
      // when AppContent detects isAuthenticated = true
      // No manual redirect needed here - let the React state flow handle it
    }
  }, [submitted, isAuthenticated]);

  /**
   * Handle form submission
   * Calls signInWithEmailLink which creates/authenticates user in Supabase
   * and sets their role in the database or localStorage (fallback)
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Attempt sign-in
      await signInWithEmailLink(email);

      // Dispatch custom event to notify AuthProvider of localStorage changes
      // This is necessary because browser doesn't fire storage events on
      // the same tab that made the change (only on other tabs/windows)
      window.dispatchEvent(
        new CustomEvent('authStorageChange', {
          detail: { key: 'mockAuthUser' },
        }),
      );

      // Show success message
      setSubmitted(true);
      setEmail('');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(errorMessage);
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle quick-login for test accounts (emulator mode only)
   * Impersonates the selected test user for faster QA workflows
   */
  const handleQuickLogin = (testAccount: TestAccountButton) => {
    impersonateUserForQA({
      email: testAccount.email,
      role: testAccount.role,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white dark:from-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <img src="/shyftlogo.png" alt="Shyft Solutions logo" className="h-10 w-auto" />
          <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
            Onboard<span className="text-brand-600">Hub</span>
          </span>
        </div>

        {/* Sign-in Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Sign in with your company email to get started
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  {error}
                </p>
                {error.includes('not recognized') && (
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Try: test-employee@example.com
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {submitted && (
            <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Mail className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  Sign-in successful!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  You should be redirected shortly...
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={loading || submitted}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || submitted || !email}
              className="w-full px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Test Emails Info */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Test Accounts
            </p>

            {/* Quick Login Buttons (Emulator Mode Only) */}
            {isEmulatorMode && (
              <div className="mb-4 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Quick Login (Dev Mode):
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {TEST_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => handleQuickLogin(account)}
                      disabled={loading || submitted}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorStyles[account.color]}`}
                      title={`Quick login as ${account.role}`}
                    >
                      <LogIn size={16} />
                      {account.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Test Email Reference */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded">
                <code className="font-mono">test-employee@example.com</code>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                  Employee
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded">
                <code className="font-mono">test-manager@example.com</code>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                  Manager
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded">
                <code className="font-mono">test-admin@example.com</code>
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          This is a mock sign-in for demonstration purposes.
          <br />
          No email will be sent.
        </p>
      </div>
    </div>
  );
}
