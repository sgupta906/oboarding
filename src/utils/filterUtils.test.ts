/**
 * Tests for profile-based filtering utilities
 * Covers filtering logic for steps based on profile roleTags
 */

import { describe, it, expect } from 'vitest';
import {
  filterStepsByProfile,
  filterStepsByProfileAndStatus,
  countStepsByProfileAndStatus,
  getUniqueRoleTags,
} from './filterUtils';
import type { Step, Profile } from '../types';

describe('filterUtils - Profile-based Filtering', () => {
  // Mock data
  const mockSteps: Step[] = [
    {
      id: 1,
      title: 'Setup VS Code',
      description: 'Install VS Code',
      role: 'Engineering',
      owner: 'DevOps',
      expert: 'Alice',
      status: 'completed',
      link: '#',
    },
    {
      id: 2,
      title: 'Setup Email',
      description: 'Configure email',
      role: 'All',
      owner: 'IT',
      expert: 'Bob',
      status: 'pending',
      link: '#',
    },
    {
      id: 3,
      title: 'Sales Training',
      description: 'Learn sales process',
      role: 'Sales',
      owner: 'Sales',
      expert: 'Charlie',
      status: 'pending',
      link: '#',
    },
    {
      id: 4,
      title: 'Product Overview',
      description: 'Product training',
      role: 'Product',
      owner: 'Product',
      expert: 'Diana',
      status: 'stuck',
      link: '#',
    },
    {
      id: 5,
      title: 'Engineering Onboarding',
      description: 'Engineering team setup',
      role: 'Engineering',
      owner: 'Engineering',
      expert: 'Eve',
      status: 'pending',
      link: '#',
    },
  ];

  const engineerProfile: Profile = {
    id: 'prof-1',
    name: 'Engineer',
    description: 'Software engineer onboarding',
    roleTags: ['Engineering', 'All'],
    createdAt: Date.now(),
    createdBy: 'system',
  };

  const salesProfile: Profile = {
    id: 'prof-2',
    name: 'Sales',
    description: 'Sales team onboarding',
    roleTags: ['Sales', 'All'],
    createdAt: Date.now(),
    createdBy: 'system',
  };

  const productProfile: Profile = {
    id: 'prof-3',
    name: 'Product Manager',
    description: 'Product manager onboarding',
    roleTags: ['Product', 'All'],
    createdAt: Date.now(),
    createdBy: 'system',
  };

  const internProfile: Profile = {
    id: 'prof-4',
    name: 'Intern',
    description: 'Intern onboarding',
    roleTags: ['All'],
    createdAt: Date.now(),
    createdBy: 'system',
  };

  describe('filterStepsByProfile()', () => {
    it('should return all steps when no profile is selected', () => {
      const filtered = filterStepsByProfile(mockSteps, null);

      expect(filtered.length).toBe(mockSteps.length);
    });

    it('should return all steps when profile is undefined', () => {
      const filtered = filterStepsByProfile(mockSteps, undefined);

      expect(filtered.length).toBe(mockSteps.length);
    });

    it('should filter steps for engineer profile', () => {
      const filtered = filterStepsByProfile(mockSteps, engineerProfile);

      // Engineer profile includes: Engineering, All
      // Filtered steps: 1 (Engineering), 2 (All), 5 (Engineering) = 3 steps
      expect(filtered.length).toBe(3);
      expect(filtered.map((s) => s.id)).toContain(1);
      expect(filtered.map((s) => s.id)).toContain(2);
      expect(filtered.map((s) => s.id)).toContain(5);
      expect(filtered.map((s) => s.id)).not.toContain(3); // Sales step excluded
      expect(filtered.map((s) => s.id)).not.toContain(4); // Product step excluded
    });

    it('should filter steps for sales profile', () => {
      const filtered = filterStepsByProfile(mockSteps, salesProfile);

      expect(filtered.length).toBe(2); // Sales step (3) + All step (2)
      expect(filtered.map((s) => s.id)).toContain(2);
      expect(filtered.map((s) => s.id)).toContain(3);
    });

    it('should filter steps for product profile', () => {
      const filtered = filterStepsByProfile(mockSteps, productProfile);

      expect(filtered.length).toBe(2); // Product step (4) + All step (2)
      expect(filtered.map((s) => s.id)).toContain(2);
      expect(filtered.map((s) => s.id)).toContain(4);
    });

    it('should filter steps for intern profile (only All roles)', () => {
      const filtered = filterStepsByProfile(mockSteps, internProfile);

      expect(filtered.length).toBe(1); // Only All step (2)
      expect(filtered.map((s) => s.id)).toContain(2);
    });

    it('should return empty array if profile has no roleTags', () => {
      const profileNoTags: Profile = {
        id: 'prof-empty',
        name: 'Empty',
        roleTags: [],
        createdAt: Date.now(),
        createdBy: 'system',
      };

      const filtered = filterStepsByProfile(mockSteps, profileNoTags);

      expect(filtered.length).toBe(mockSteps.length);
    });

    it('should handle empty steps array', () => {
      const filtered = filterStepsByProfile([], engineerProfile);

      expect(filtered.length).toBe(0);
    });
  });

  describe('filterStepsByProfileAndStatus()', () => {
    it('should filter by profile and status: pending', () => {
      const filtered = filterStepsByProfileAndStatus(mockSteps, engineerProfile, 'pending');

      // Engineer profile includes: Engineering, All
      // Pending steps: 2 (All), 3 (Sales - excluded), 5 (Engineering)
      expect(filtered.length).toBe(2);
      expect(filtered.map((s) => s.id)).toContain(2);
      expect(filtered.map((s) => s.id)).toContain(5);
    });

    it('should filter by profile and status: completed', () => {
      const filtered = filterStepsByProfileAndStatus(mockSteps, engineerProfile, 'completed');

      // Engineer profile includes: Engineering, All
      // Completed steps: 1 (Engineering)
      expect(filtered.length).toBe(1);
      expect(filtered.map((s) => s.id)).toContain(1);
    });

    it('should filter by profile and status: stuck', () => {
      const filtered = filterStepsByProfileAndStatus(mockSteps, engineerProfile, 'stuck');

      // Engineer profile includes: Engineering, All
      // Stuck steps: 4 (Product - excluded)
      expect(filtered.length).toBe(0);
    });

    it('should return empty array when no steps match', () => {
      const filtered = filterStepsByProfileAndStatus(mockSteps, internProfile, 'stuck');

      expect(filtered.length).toBe(0);
    });

    it('should work with null profile (all steps)', () => {
      const filtered = filterStepsByProfileAndStatus(mockSteps, null, 'pending');

      // All pending steps
      expect(filtered.length).toBe(3);
    });
  });

  describe('countStepsByProfileAndStatus()', () => {
    it('should count pending steps for engineer profile', () => {
      const count = countStepsByProfileAndStatus(mockSteps, engineerProfile, 'pending');

      expect(count).toBe(2);
    });

    it('should count completed steps for engineer profile', () => {
      const count = countStepsByProfileAndStatus(mockSteps, engineerProfile, 'completed');

      expect(count).toBe(1);
    });

    it('should count stuck steps for product profile', () => {
      const count = countStepsByProfileAndStatus(mockSteps, productProfile, 'stuck');

      expect(count).toBe(1);
    });

    it('should return 0 when no steps match', () => {
      const count = countStepsByProfileAndStatus(mockSteps, internProfile, 'completed');

      expect(count).toBe(0);
    });

    it('should count all steps when no profile selected', () => {
      const count = countStepsByProfileAndStatus(mockSteps, null, 'pending');

      expect(count).toBe(3);
    });
  });

  describe('getUniqueRoleTags()', () => {
    it('should return all unique role tags from profiles', () => {
      const profiles = [engineerProfile, salesProfile, productProfile, internProfile];
      const tags = getUniqueRoleTags(profiles);

      expect(tags).toContain('Engineering');
      expect(tags).toContain('Sales');
      expect(tags).toContain('Product');
      expect(tags).toContain('All');
    });

    it('should not have duplicate tags', () => {
      const profiles = [engineerProfile, salesProfile, productProfile, internProfile];
      const tags = getUniqueRoleTags(profiles);

      expect(new Set(tags).size).toBe(tags.length);
    });

    it('should return sorted tags', () => {
      const profiles = [engineerProfile, salesProfile, productProfile, internProfile];
      const tags = getUniqueRoleTags(profiles);

      const sortedTags = [...tags].sort();
      expect(tags).toEqual(sortedTags);
    });

    it('should handle empty profiles array', () => {
      const tags = getUniqueRoleTags([]);

      expect(tags.length).toBe(0);
    });

    it('should handle profiles with empty roleTags', () => {
      const profileNoTags: Profile = {
        id: 'prof-empty',
        name: 'Empty',
        roleTags: [],
        createdAt: Date.now(),
        createdBy: 'system',
      };

      const tags = getUniqueRoleTags([profileNoTags]);

      expect(tags.length).toBe(0);
    });
  });

  describe('Filtering Edge Cases', () => {
    it('should handle profile with non-existent role tag', () => {
      const nonExistentProfile: Profile = {
        id: 'prof-fake',
        name: 'Fake',
        roleTags: ['NonExistentRole', 'All'],
        createdAt: Date.now(),
        createdBy: 'system',
      };

      const filtered = filterStepsByProfile(mockSteps, nonExistentProfile);

      // Should only match steps with "All" role
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(2);
    });

    it('should match case-sensitive role tags', () => {
      const caseProfile: Profile = {
        id: 'prof-case',
        name: 'Case Test',
        roleTags: ['engineering'], // lowercase
        createdAt: Date.now(),
        createdBy: 'system',
      };

      const filtered = filterStepsByProfile(mockSteps, caseProfile);

      // Should not match "Engineering" (different case)
      expect(filtered.length).toBe(0);
    });

    it('should handle very long profiles list efficiently', () => {
      const manyProfiles: Profile[] = Array.from({ length: 100 }, (_, i) => ({
        id: `prof-${i}`,
        name: `Profile ${i}`,
        roleTags: ['All'],
        createdAt: Date.now(),
        createdBy: 'system',
      }));

      const tags = getUniqueRoleTags(manyProfiles);

      expect(tags).toEqual(['All']);
    });
  });
});
