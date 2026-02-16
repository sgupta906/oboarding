/**
 * Unit tests for KPISection component
 * Tests rendering, dark mode class presence on profile filter, and light mode regression
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPISection } from './KPISection';
import type { Step, Suggestion, Profile } from '../../types';

// Mock KPICard to avoid deep dependency tree
vi.mock('./KPICard', () => ({
  KPICard: ({ label, value }: { label: string; value: number }) => (
    <div data-testid={`kpi-${label}`}>{label}: {value}</div>
  ),
}));

// Mock filterUtils
vi.mock('../../utils/filterUtils', () => ({
  countStepsByProfileAndStatus: vi.fn(() => 0),
}));

const mockSteps: Step[] = [];
const mockSuggestions: Suggestion[] = [];

const mockProfiles: Profile[] = [
  {
    id: 'p1',
    name: 'Engineer',
    roleTags: ['Engineering', 'All'],
    createdAt: Date.now(),
    createdBy: 'admin',
  },
  {
    id: 'p2',
    name: 'Sales',
    roleTags: ['Sales', 'All'],
    createdAt: Date.now(),
    createdBy: 'admin',
  },
];

describe('KPISection dark mode', () => {
  it('renders profile filter dropdown when profiles provided', () => {
    render(
      <KPISection
        steps={mockSteps}
        suggestions={mockSuggestions}
        profiles={mockProfiles}
        onProfileChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Filter KPIs by profile')).toBeInTheDocument();
    expect(screen.getByText('Filter by Profile:')).toBeInTheDocument();
  });

  it('label has dark:text-slate-200 and uses slate not gray', () => {
    render(
      <KPISection
        steps={mockSteps}
        suggestions={mockSuggestions}
        profiles={mockProfiles}
        onProfileChange={vi.fn()}
      />
    );

    const label = screen.getByText('Filter by Profile:');
    expect(label.className).toContain('dark:text-slate-200');
    expect(label.className).toContain('text-slate-700');
    expect(label.className).not.toContain('text-gray-700');
  });

  it('select has dark mode classes and uses slate not gray', () => {
    render(
      <KPISection
        steps={mockSteps}
        suggestions={mockSuggestions}
        profiles={mockProfiles}
        onProfileChange={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Filter KPIs by profile');
    expect(select.className).toContain('dark:border-slate-600');
    expect(select.className).toContain('dark:bg-slate-700');
    expect(select.className).toContain('dark:text-white');
    expect(select.className).toContain('border-slate-300');
    expect(select.className).not.toContain('gray-300');
  });

  it('light mode classes still present (regression)', () => {
    render(
      <KPISection
        steps={mockSteps}
        suggestions={mockSuggestions}
        profiles={mockProfiles}
        onProfileChange={vi.fn()}
      />
    );

    const label = screen.getByText('Filter by Profile:');
    expect(label.className).toContain('text-slate-700');

    const select = screen.getByLabelText('Filter KPIs by profile');
    expect(select.className).toContain('border');
  });
});
