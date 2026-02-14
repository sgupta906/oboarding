/**
 * DarkModeContext - Global dark mode state management
 * Provides theme state to entire application tree
 * Handles localStorage persistence and document class synchronization
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

/**
 * DarkModeProvider - Wraps application to manage dark mode state
 * Must be placed at root level (before any components that use dark mode)
 * Initializes from localStorage, defaults to light mode
 * Syncs dark class to document root element
 */
export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem('theme-preference');
    if (stored) {
      return stored === 'dark';
    }

    // Default to light mode (do NOT use system preference)
    return false;
  });

  // Apply theme to document root on mount and when isDarkMode changes
  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist to localStorage
    localStorage.setItem('theme-preference', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

/**
 * Custom hook to access dark mode state
 * Must be called from within a component wrapped by DarkModeProvider
 * @throws Error if used outside of DarkModeProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useDarkMode(): DarkModeContextType {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}
