import { useState, useEffect, useRef } from 'react';
import { DarkModeProvider } from './context/DarkModeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './config/authContext';
import { OnboardingHub } from './components/OnboardingHub';
import { TemplatesView } from './views/TemplatesView';
import { SignInView } from './views/SignInView';
import { SignOutView } from './views/SignOutView';
import { NavBar } from './components/ui/NavBar';

/**
 * AppContent Component - Main application content with role-based routing
 * Separated from App to allow useAuth hook to work properly
 * Requires AuthProvider to be wrapped around it
 */
function AppContent() {
  const { loading, isAuthenticated, role } = useAuth();

  // Initialize currentView based on user role: managers/admins start with manager view, employees with employee view
  const getInitialView = (): 'employee' | 'manager' => {
    return role === 'manager' || role === 'admin' ? 'manager' : 'employee';
  };

  const [currentView, setCurrentView] = useState<'employee' | 'manager'>(getInitialView);
  const previousRoleRef = useRef<typeof role>(undefined);
  const [currentRoute, setCurrentRoute] = useState<'templates' | 'onboarding' | 'sign-out'>('onboarding');

  // Set correct initial view when role resolves or changes (e.g. sign-out then sign-in as different user)
  useEffect(() => {
    // Only act when role transitions from null/undefined to an actual value
    if (role !== null && previousRoleRef.current !== role) {
      previousRoleRef.current = role;
      if (role === 'manager' || role === 'admin') {
        setCurrentView('manager');
      } else {
        setCurrentView('employee');
      }
    }
    // Reset tracking when user signs out (role becomes null)
    if (role === null) {
      previousRoleRef.current = undefined;
    }
  }, [role]);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/templates') {
        setCurrentRoute('templates');
      } else if (hash === '#/sign-out') {
        setCurrentRoute('sign-out');
      } else {
        setCurrentRoute('onboarding');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-out view (this component handles its own redirect to #/ after sign-out completes)
  if (currentRoute === 'sign-out') {
    return <SignOutView />;
  }

  // Show sign-in view if not authenticated
  // This handles the redirect from sign-out when hash changes back to #/
  if (!isAuthenticated) {
    return <SignInView />;
  }

  // Check if user can access templates route
  const canAccessTemplates = role === 'manager' || role === 'admin';

  // Redirect to onboarding if non-manager tries to access templates
  if (currentRoute === 'templates' && !canAccessTemplates) {
    window.location.hash = '#/';
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <OnboardingHub currentView={currentView} onViewChange={setCurrentView} />
      </div>
    );
  }

  // Show templates view if on templates route
  if (currentRoute === 'templates' && canAccessTemplates) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <NavBar currentView={currentView} onViewChange={setCurrentView} />
        <TemplatesView />
      </div>
    );
  }

  // Show main onboarding experience if authenticated (NavBar for ALL authenticated users)
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <NavBar currentView={currentView} onViewChange={setCurrentView} />
      <OnboardingHub currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

/**
 * Main App Component
 * Entry point for the application
 * Security layers:
 * 1. AuthProvider - Manages Supabase auth state and role-based access
 * 2. DarkModeProvider - Manages UI theme
 * 3. Role-based routing in AppContent
 *
 * Architecture:
 * - AuthProvider wraps everything (needs to be outermost)
 * - DarkModeProvider wraps AppContent (theme context)
 * - AppContent uses useAuth hook for role-based routing
 */
function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;
