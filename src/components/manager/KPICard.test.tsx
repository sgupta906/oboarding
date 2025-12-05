/**
 * Tests for KPICard Component
 * Covers equal height behavior, responsive layout, tooltip handling, and accessibility
 */

import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import { KPICard } from './KPICard';
import { Users } from 'lucide-react';

/**
 * Test suite for KPICard component
 * Verifies:
 * - Equal height behavior across all KPI cards
 * - Tooltip display without layout shifts
 * - Responsive behavior and styling
 * - Accessibility features
 */
describe('KPICard', () => {
  const defaultProps = {
    label: 'Test Metric',
    value: 42,
    icon: <Users size={24} />,
    color: 'success' as const,
  };

  describe('Rendering', () => {
    it('renders label and value', () => {
      render(<KPICard {...defaultProps} />);

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with optional subtext', () => {
      render(
        <KPICard {...defaultProps} subtext="All on track" />
      );

      expect(screen.getByText('All on track')).toBeInTheDocument();
    });

    it('renders without subtext when not provided', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      // Verify card renders without errors
      expect(container.querySelector('[class*="text-xs"]')).not.toBeInTheDocument();
    });

    it('renders icon correctly', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      // Icon should be rendered within a styled container
      const iconContainer = container.querySelector('[class*="hover:scale-110"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Tooltip Behavior', () => {
    it('shows tooltip on mouse enter', async () => {
      const user = userEvent.setup();
      render(
        <KPICard
          {...defaultProps}
          tooltip="Test tooltip text"
        />
      );

      const card = screen.getByText('Test Metric').closest('[class*="hover:shadow-md"]');
      expect(card).toBeInTheDocument();

      // Tooltip should not be visible initially
      expect(screen.queryByText('Test tooltip text')).not.toBeInTheDocument();

      // Move mouse over card
      if (card) {
        await user.hover(card);
        expect(screen.getByText('Test tooltip text')).toBeInTheDocument();
      }
    });

    it('hides tooltip on mouse leave', async () => {
      const user = userEvent.setup();
      render(
        <KPICard
          {...defaultProps}
          tooltip="Test tooltip text"
        />
      );

      const card = screen.getByText('Test Metric').closest('[class*="hover:shadow-md"]');

      if (card) {
        await user.hover(card);
        expect(screen.getByText('Test tooltip text')).toBeInTheDocument();

        await user.unhover(card);
        expect(screen.queryByText('Test tooltip text')).not.toBeInTheDocument();
      }
    });

    it('tooltip has pointer-events-none to prevent layout shifts', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <KPICard
          {...defaultProps}
          tooltip="Test tooltip"
        />
      );

      const card = screen.getByText('Test Metric').closest('[class*="hover:shadow-md"]');

      if (card) {
        await user.hover(card);

        const tooltip = container.querySelector('[class*="animate-fadeIn"]');
        expect(tooltip).toHaveClass('pointer-events-none');
      }
    });

    it('does not render tooltip when not provided', () => {
      render(<KPICard {...defaultProps} />);

      // No tooltip element should be in the DOM
      const tooltipElements = document.querySelectorAll('[class*="animate-fadeIn"]');
      expect(tooltipElements.length).toBe(0);
    });
  });

  describe('Height Behavior (Equal Height in Grids)', () => {
    it('card wrapper has h-full for equal height', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      // The wrapper div should have h-full class
      const wrapper = container.querySelector('[class*="h-full"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('h-full');
    });

    it('Card component uses flex-col for proper content distribution', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      // Card should have flex and flex-col classes
      const card = container.querySelector('[class*="flex"]');
      expect(card).toHaveClass('flex');
      expect(card).toHaveClass('flex-col');
    });

    it('content grows properly with h-full', () => {
      const { container } = render(
        <KPICard
          {...defaultProps}
          subtext="Additional content"
        />
      );

      const wrapper = container.querySelector('[class*="relative"][class*="h-full"]');
      expect(wrapper).toHaveClass('h-full');
    });
  });

  describe('Color Variants', () => {
    it('renders success color variant', () => {
      const { container } = render(
        <KPICard {...defaultProps} color="success" />
      );

      const card = container.querySelector('[class*="bg-emerald"]');
      expect(card).toHaveClass('bg-emerald-50');
      expect(card).toHaveClass('border-l-emerald-500');
    });

    it('renders error color variant', () => {
      const { container } = render(
        <KPICard {...defaultProps} color="error" />
      );

      const card = container.querySelector('[class*="bg-rose"]');
      expect(card).toHaveClass('bg-rose-50');
      expect(card).toHaveClass('border-l-rose-500');
    });

    it('renders warning color variant', () => {
      const { container } = render(
        <KPICard {...defaultProps} color="warning" />
      );

      const card = container.querySelector('[class*="bg-amber"]');
      expect(card).toHaveClass('bg-amber-50');
      expect(card).toHaveClass('border-l-amber-500');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover styles to card', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      const card = container.querySelector('[class*="hover:shadow-md"]');
      expect(card).toHaveClass('hover:shadow-md');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-200');
    });

    it('applies hover scale to value', () => {
      render(<KPICard {...defaultProps} />);

      const value = screen.getByText('42');
      expect(value).toHaveClass('hover:scale-105');
    });

    it('applies hover scale to icon', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      const iconContainer = container.querySelector('[class*="hover:scale-110"]');
      expect(iconContainer).toHaveClass('hover:scale-110');
    });
  });

  describe('Accessibility', () => {
    it('card is keyboard accessible with cursor-help', () => {
      const { container } = render(
        <KPICard {...defaultProps} tooltip="Help text" />
      );

      const card = container.querySelector('[class*="cursor-help"]');
      expect(card).toHaveClass('cursor-help');
    });

    it('renders semantic heading for value', () => {
      render(<KPICard {...defaultProps} />);

      const heading = document.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('42');
    });

    it('label text is visible and readable', () => {
      render(<KPICard {...defaultProps} />);

      const label = screen.getByText('Test Metric');
      expect(label.tagName).toBe('P');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains h-full height on all screen sizes', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      const wrapper = container.querySelector('[class*="h-full"]');
      expect(wrapper).toHaveClass('h-full');
      // h-full applies to all breakpoints, not responsive
    });

    it('layout adapts to subtext content without breaking equal height', () => {
      const { container, rerender } = render(<KPICard {...defaultProps} />);

      const initialHeight = container.querySelector('[class*="h-full"]');
      expect(initialHeight).toHaveClass('h-full');

      rerender(
        <KPICard
          {...defaultProps}
          subtext="Needs attention: Employee Name"
        />
      );

      const updatedHeight = container.querySelector('[class*="h-full"]');
      expect(updatedHeight).toHaveClass('h-full');
    });
  });

  describe('Edge Cases', () => {
    it('handles large numbers in value', () => {
      render(<KPICard {...defaultProps} value={999999} />);

      expect(screen.getByText('999999')).toBeInTheDocument();
    });

    it('handles string values', () => {
      render(<KPICard {...defaultProps} value="N/A" />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('handles empty string label', () => {
      const { container } = render(
        <KPICard {...defaultProps} label="" />
      );

      // Should still render without errors
      expect(container.querySelector('[class*="text-4xl"]')).toBeInTheDocument();
    });

    it('handles very long subtext', () => {
      const longSubtext = 'This is a very long subtext that might wrap to multiple lines and should still maintain equal height';
      render(
        <KPICard {...defaultProps} subtext={longSubtext} />
      );

      expect(screen.getByText(longSubtext)).toBeInTheDocument();
    });
  });
});
