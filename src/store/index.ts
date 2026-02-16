/**
 * Zustand Store - Barrel Export
 *
 * Central export point for the application's Zustand store.
 * Future slices will be added here as the migration progresses.
 */

export { useOnboardingStore, resetStoreInternals } from './useOnboardingStore';
export type { OnboardingStore, InstancesSlice } from './useOnboardingStore';
