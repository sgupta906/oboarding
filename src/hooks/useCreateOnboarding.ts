/**
 * useCreateOnboarding Hook - Custom hook for creating onboarding instances
 * Wraps createOnboardingRunFromTemplate from Supabase service layer
 * Handles loading states, errors, and conversion to user-friendly messages
 */

import { useState, useCallback } from 'react';
import {
  createOnboardingRunFromTemplate,
  OnboardingValidationError,
} from '../services/supabase';
import { useOnboardingStore } from '../store/useOnboardingStore';
import type { CreateOnboardingRunInput } from '../services/supabase';
import type { OnboardingInstance } from '../types';

interface UseCreateOnboardingReturn {
  mutate: (data: CreateOnboardingRunInput) => Promise<OnboardingInstance>;
  isLoading: boolean;
  error: string | null;
  data: OnboardingInstance | null;
  reset: () => void;
}

/**
 * Custom hook for creating onboarding instances with error handling
 * Automatically converts validation and network errors to user-friendly messages
 * Clears error state on successful submissions
 * @returns Object with mutate function, loading state, error message, and data
 */
export function useCreateOnboarding(): UseCreateOnboardingReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingInstance | null>(null);

  const mutate = useCallback(
    async (employeeData: CreateOnboardingRunInput): Promise<OnboardingInstance> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await createOnboardingRunFromTemplate(employeeData);
        setData(result);
        useOnboardingStore.getState()._addInstance(result);
        setIsLoading(false);
        return result;
      } catch (err) {
        const errorMessage = convertErrorToUserMessage(err);
        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { mutate, isLoading, error, data, reset };
}

/**
 * Converts various error types to user-friendly messages
 * Handles validation errors, network errors, and unknown errors
 * @param err - The error object to convert
 * @returns User-friendly error message
 */
function convertErrorToUserMessage(err: unknown): string {
  if (err instanceof OnboardingValidationError) {
    // Validation errors have specific messages
    const message = err.message;

    // Provide more specific guidance for common validation errors
    if (message.includes('Template not found')) {
      return 'The selected template no longer exists. Please select a different template.';
    }

    if (message.includes('employeeName')) {
      return 'Please provide a valid employee name.';
    }

    if (message.includes('employeeEmail')) {
      return 'Please provide a valid email address.';
    }

    if (message.includes('templateId')) {
      return 'Please select a valid template.';
    }

    // Default validation error message
    return 'Please check the form fields and try again.';
  }

  if (err instanceof Error) {
    const message = err.message;

    // Handle network/connectivity errors
    if (message.includes('network') || message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Handle permission/auth errors
    if (message.includes('permission') || message.includes('Permission')) {
      return 'You do not have permission to create onboarding instances.';
    }

    // Handle database/server errors
    if (message.includes('database') || message.includes('Database')) {
      return 'Server error. Please try again in a few moments.';
    }

    // Return original error message if it's descriptive
    if (message.length > 10 && !message.includes('undefined')) {
      return message;
    }
  }

  // Unknown error
  return 'An unexpected error occurred. Please try again later.';
}
