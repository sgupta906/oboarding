/**
 * Unit tests for StepCard component
 * Tests the amber "Feedback Sent" badge and ring styling for pending suggestions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepCard } from './StepCard';
import type { Step } from '../../types';

const createStep = (overrides: Partial<Step> = {}): Step => ({
  id: 1,
  title: 'Setup Corporate Gmail',
  description: 'Your temporary password is in your personal email.',
  role: 'All',
  owner: 'IT Support',
  expert: 'Sarah J.',
  status: 'pending',
  link: '#',
  ...overrides,
});

const defaultHandlers = {
  onStatusChange: vi.fn(),
  onSuggestEdit: vi.fn(),
  onReportStuck: vi.fn(),
};

describe('StepCard', () => {
  describe('Feedback Sent badge', () => {
    it('renders "Feedback Sent" badge when hasPendingSuggestion is true', () => {
      render(
        <StepCard
          step={createStep()}
          index={0}
          {...defaultHandlers}
          hasPendingSuggestion={true}
        />
      );

      expect(screen.getByText('Feedback Sent')).toBeInTheDocument();
    });

    it('does NOT render "Feedback Sent" badge when hasPendingSuggestion is false', () => {
      render(
        <StepCard
          step={createStep()}
          index={0}
          {...defaultHandlers}
          hasPendingSuggestion={false}
        />
      );

      expect(screen.queryByText('Feedback Sent')).not.toBeInTheDocument();
    });

    it('does NOT render "Feedback Sent" badge when hasPendingSuggestion is undefined', () => {
      render(
        <StepCard
          step={createStep()}
          index={0}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByText('Feedback Sent')).not.toBeInTheDocument();
    });

    it('badge contains MessageSquare icon (svg element)', () => {
      render(
        <StepCard
          step={createStep()}
          index={0}
          {...defaultHandlers}
          hasPendingSuggestion={true}
        />
      );

      const badge = screen.getByText('Feedback Sent');
      // The badge should contain an SVG (MessageSquare icon)
      const svg = badge.closest('span')?.querySelector('svg');
      expect(svg).not.toBeNull();
    });
  });

  describe('amber ring styling', () => {
    it('adds amber ring classes on pending step card when hasPendingSuggestion is true', () => {
      const { container } = render(
        <StepCard
          step={createStep({ status: 'pending' })}
          index={0}
          {...defaultHandlers}
          hasPendingSuggestion={true}
        />
      );

      // The Card element with border-l-4 should have amber ring classes
      const card = container.querySelector('.border-l-4');
      expect(card).not.toBeNull();
      expect(card!.className).toContain('ring-2');
      expect(card!.className).toContain('ring-amber-200');
    });

    it('includes dark mode ring class when hasPendingSuggestion is true', () => {
      const { container } = render(
        <StepCard
          step={createStep({ status: 'pending' })}
          index={0}
          {...defaultHandlers}
          hasPendingSuggestion={true}
        />
      );

      const card = container.querySelector('.border-l-4');
      expect(card).not.toBeNull();
      expect(card!.className).toContain('dark:ring-amber-800');
    });
  });
});
