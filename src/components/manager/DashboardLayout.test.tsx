/**
 * Unit tests for dashboard layout balance fix (Bug #32)
 * Verifies that flex utilities are applied to SuggestionsSection,
 * ActivitySection, and ActivityFeed so grid children stretch to fill cells.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SuggestionsSection } from './SuggestionsSection';
import { ActivitySection } from './ActivitySection';
import { ActivityFeed } from './ActivityFeed';
import type { Suggestion, Activity } from '../../types';

// Mock SuggestionCard to avoid deep dependency tree
vi.mock('./SuggestionCard', () => ({
  SuggestionCard: ({ suggestion }: { suggestion: Suggestion }) => (
    <div data-testid={`suggestion-${suggestion.id}`}>{suggestion.text}</div>
  ),
}));

const mockPendingSuggestion: Suggestion = {
  id: 1,
  stepId: 100,
  user: 'Test User',
  text: 'Fix the docs',
  status: 'pending',
};

const mockActivity: Activity = {
  id: 'a1',
  userInitials: 'TU',
  action: 'completed Step 1',
  timeAgo: '5m ago',
};

describe('Dashboard Layout Balance (Bug #32)', () => {
  describe('SuggestionsSection', () => {
    it('root div has flex and flex-col classes', () => {
      const { container } = render(
        <SuggestionsSection suggestions={[]} steps={[]} />
      );
      // The root div is the first child of the container
      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('flex');
      expect(rootDiv.className).toContain('flex-col');
    });

    it('empty-state Card has flex-1, flex-col, and justify-center classes', () => {
      const { container } = render(
        <SuggestionsSection suggestions={[]} steps={[]} />
      );
      // The empty-state Card is rendered when no pending suggestions exist.
      // Card renders a div with bg-white... classes. It is the second child
      // of the root div (first is the header row).
      const rootDiv = container.firstElementChild as HTMLElement;
      const cardDiv = rootDiv.children[1] as HTMLElement;
      expect(cardDiv.className).toContain('flex-1');
      expect(cardDiv.className).toContain('flex-col');
      expect(cardDiv.className).toContain('justify-center');
    });

    it('suggestions list has flex-1 class when suggestions exist', () => {
      const { container } = render(
        <SuggestionsSection
          suggestions={[mockPendingSuggestion]}
          steps={[]}
        />
      );
      const rootDiv = container.firstElementChild as HTMLElement;
      // When suggestions exist, the second child is the list div
      const listDiv = rootDiv.children[1] as HTMLElement;
      expect(listDiv.className).toContain('flex-1');
    });
  });

  describe('ActivitySection', () => {
    it('root div has flex and flex-col classes', () => {
      const { container } = render(
        <ActivitySection activities={[mockActivity]} />
      );
      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('flex');
      expect(rootDiv.className).toContain('flex-col');
    });
  });

  describe('ActivityFeed', () => {
    it('Card wrapper has flex-1 class when activities exist', () => {
      const { container } = render(
        <ActivityFeed activities={[mockActivity]} />
      );
      // The Card renders a div as the first child of container
      const cardDiv = container.firstElementChild as HTMLElement;
      expect(cardDiv.className).toContain('flex-1');
    });
  });
});
