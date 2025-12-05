/**
 * useDarkMode Hook - Manages application theme state and persistence
 * Handles switching between light and dark modes with localStorage persistence
 * Applies/removes 'dark' class to document root element
 */

import { useEffect, useState } from 'react';

interface UseDarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

/**
 * Custom hook for managing dark mode state
 * Persists preference to localStorage and syncs with HTML class
 * @returns Object with isDarkMode state and toggleDarkMode function
 */
export function useDarkMode(): UseDarkModeReturn {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme-preference');
    if (stored) {
      return stored === 'dark';
    }

    // Fall back to system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  });

  useEffect(() => {
    // Apply theme to document root
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

  return { isDarkMode, toggleDarkMode };
}
