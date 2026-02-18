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
import { signInWithEmailLink, signInWithGoogle } from '../services/authService';
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

      // Attempt sign-in (authService dispatches authStorageChange internally)
      await signInWithEmailLink(email);

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
   * Handle Google OAuth sign-in
   * Calls signInWithGoogle which redirects to Google consent screen
   */
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Browser will redirect to Google -- no further action needed
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
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

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading || submitted}
            aria-label="Sign in with Google"
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">or</span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
          </div>

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
          {isEmulatorMode ? (
            <>
              Development mode. Quick-login buttons and test accounts available.
            </>
          ) : (
            <>
              Sign in with your company Google account.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
