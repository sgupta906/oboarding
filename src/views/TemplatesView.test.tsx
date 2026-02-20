/**
 * TemplatesView Component Tests
 * Verifies template card footer button structure and labels.
 * Bug #34: Delete button should have a "Delete" text label and flex-1
 * matching the Edit and Duplicate button patterns.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplatesView } from './TemplatesView';
import type { Template, Step } from '../types';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockSteps: Step[] = [
  {
    id: 1,
    title: 'Setup laptop',
    description: 'Get your laptop ready',
    role: 'Engineering',
    owner: 'IT Support',
    expert: 'John',
    status: 'pending',
    link: '',
  },
];

const mockTemplates: Template[] = [
  {
    id: 'tmpl-1',
    name: 'Engineering Onboarding',
    description: 'Standard engineering onboarding template',
    role: 'Engineering',
    steps: mockSteps,
    createdAt: 1701532800000,
    isActive: true,
  },
];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockRefetch = vi.fn();

vi.mock('../hooks', () => ({
  useTemplates: () => ({
    data: mockTemplates,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
  }),
  useRoles: () => ({
    roles: [],
    isLoading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TemplatesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card footer button labels', () => {
    it('delete button renders "Delete" text label', () => {
      render(<TemplatesView />);

      const deleteButton = screen.getByRole('button', {
        name: /delete template/i,
      });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent('Delete');
    });

    it('delete button has flex-1 class for equal width', () => {
      render(<TemplatesView />);

      const deleteButton = screen.getByRole('button', {
        name: /delete template/i,
      });
      expect(deleteButton.className).toContain('flex-1');
    });

    it('all three card footer buttons have text labels', () => {
      render(<TemplatesView />);

      // Edit button
      const editButton = screen.getByRole('button', {
        name: /edit template/i,
      });
      expect(editButton).toHaveTextContent('Edit');

      // Duplicate button
      const duplicateButton = screen.getByRole('button', {
        name: /duplicate template/i,
      });
      expect(duplicateButton).toHaveTextContent('Duplicate');

      // Delete button
      const deleteButton = screen.getByRole('button', {
        name: /delete template/i,
      });
      expect(deleteButton).toHaveTextContent('Delete');
    });
  });
});
