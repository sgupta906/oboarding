import { useEffect, useState } from 'react';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../config/authContext';

export function SignOutView() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut();
        setIsSigningOut(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sign-out failed. Please try again.';
        setError(errorMessage);
        setIsSigningOut(false);
        console.error('Sign-out error:', err);
      }
    };

    handleSignOut();
  }, [signOut]);

  useEffect(() => {
    if (isSigningOut || error) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.hash = '#/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSigningOut, error]);

  const handleReturnToSignIn = () => {
    window.location.hash = '#/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <ChevronRight size={24} strokeWidth={3} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
            Onboard<span className="text-indigo-600">Hub</span>
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 space-y-6">
          {isSigningOut ? (
            <>
              <div className="flex justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-700"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-500 animate-spin"></div>
                  <LogOut size={24} className="text-indigo-600 dark:text-indigo-400 relative z-10" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Signing out...
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Please wait while we clear your session
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto">
                <LogOut size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Sign-out Error
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {error}
                </p>
              </div>
              <button
                onClick={handleReturnToSignIn}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Return to Sign In
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto">
                <LogOut size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  You're signed out
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Your session has been safely closed
                </p>
              </div>
              <button
                onClick={handleReturnToSignIn}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Return to Sign In
              </button>
              <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                Redirecting in {secondsRemaining}s...
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
