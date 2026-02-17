/**
 * NavBar Component - Application header with branding and role-gated view switcher
 * Handles navigation between Employee and Manager views
 * Manager and Admin roles can switch views, Employee role is restricted to Employee view
 */

import { useState, useEffect } from 'react';
import { Lock, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../config/authContext';
import { hasManagerAccess } from '../../config/authTypes';
import { useDarkMode } from '../../context/DarkModeContext';
import type { NavBarProps } from '../../types';

/**
 * Renders the application navigation bar with logo and role-based view switcher
 * Security: Manager and Admin roles can access both views
 *           Employee role can only access Employee view
 *
 * @param currentView - Currently active view
 * @param onViewChange - Callback when switching views
 */
export function NavBar({ currentView, onViewChange }: NavBarProps) {
  const { role } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Track current hash route for active-state styling on Templates
  const [isTemplatesRoute, setIsTemplatesRoute] = useState(
    window.location.hash === '#/templates'
  );

  useEffect(() => {
    const handleHashChange = () => {
      setIsTemplatesRoute(window.location.hash === '#/templates');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Determine if user can access manager view
  // Any non-employee role can access manager view (supports custom roles)
  const canAccessManagerView = hasManagerAccess(role);

  const handleViewChange = (view: 'employee' | 'manager') => {
    // Update the view state
    onViewChange(view);
    // If on templates route, navigate back to onboarding view
    if (window.location.hash === '#/templates') {
      window.location.hash = '#/';
    }
  };

  const handleTemplatesClick = () => {
    window.location.hash = '#/templates';
  };

  const handleSignOut = () => {
    window.location.hash = '#/sign-out';
  };

  // Shared styles for active/inactive nav items within the switcher
  const activeStyle = 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white';
  const inactiveStyle = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300';

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/shyftlogo.png" alt="Shyft Solutions logo" className="h-8 w-auto" />
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Onboard<span className="text-brand-600">Hub</span>
          </span>
        </div>

        {/* Navigation Links and View Switcher */}
        <div className="flex items-center gap-4">
          {canAccessManagerView && (
            <>
              {/* Unified Navigation Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button
                  onClick={() => handleViewChange('employee')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currentView === 'employee' && !isTemplatesRoute
                      ? activeStyle
                      : inactiveStyle
                  }`}
                  aria-label="Switch to Employee view"
                  aria-pressed={currentView === 'employee' && !isTemplatesRoute}
                >
                  Employee View
                </button>
                <button
                  onClick={() => handleViewChange('manager')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currentView === 'manager' && !isTemplatesRoute
                      ? activeStyle
                      : inactiveStyle
                  }`}
                  aria-label="Switch to Manager view"
                  aria-pressed={currentView === 'manager' && !isTemplatesRoute}
                >
                  Manager View
                </button>
                <button
                  onClick={handleTemplatesClick}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isTemplatesRoute
                      ? activeStyle
                      : inactiveStyle
                  }`}
                  aria-label="Go to Templates"
                  aria-pressed={isTemplatesRoute}
                >
                  Templates
                </button>
              </div>
            </>
          )}

          {/* Restricted Access Indicator for Employee Role */}
          {!canAccessManagerView && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              <Lock size={16} />
              <span className="text-sm font-medium">Employee View Only</span>
            </div>
          )}

          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
