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

describe('KPISection active count', () => {
  it('returns 0 active count when onboardingInstances is empty array', () => {
    // Provide non-empty steps but empty onboardingInstances
    const stepsWithPending: Step[] = [
      {
        id: 1,
        title: 'Step 1',
        description: 'Desc',
        role: 'All',
        owner: 'IT',
        expert: 'Expert',
        status: 'pending',
        link: '',
      },
    ];
    render(
      <KPISection
        steps={stepsWithPending}
        suggestions={mockSuggestions}
        onboardingInstances={[]}
      />
    );

    // Should show "Active Onboardings: 0", NOT a step count
    expect(screen.getByTestId('kpi-Active Onboardings')).toHaveTextContent(
      'Active Onboardings: 0'
    );
  });

  it('counts active instances correctly', () => {
    const instances = [
      {
        id: 'i1',
        employeeName: 'Alice',
        employeeEmail: 'alice@test.com',
        role: 'Eng',
        department: 'Tech',
        templateId: 't1',
        steps: [],
        createdAt: Date.now(),
        progress: 50,
        status: 'active' as const,
      },
      {
        id: 'i2',
        employeeName: 'Bob',
        employeeEmail: 'bob@test.com',
        role: 'Eng',
        department: 'Tech',
        templateId: 't1',
        steps: [],
        createdAt: Date.now(),
        progress: 50,
        status: 'active' as const,
      },
      {
        id: 'i3',
        employeeName: 'Charlie',
        employeeEmail: 'charlie@test.com',
        role: 'Eng',
        department: 'Tech',
        templateId: 't1',
        steps: [],
        createdAt: Date.now(),
        progress: 100,
        status: 'completed' as const,
      },
    ];

    render(
      <KPISection
        steps={mockSteps}
        suggestions={mockSuggestions}
        onboardingInstances={instances}
      />
    );

    // 2 active + 1 completed = should count 2
    expect(screen.getByTestId('kpi-Active Onboardings')).toHaveTextContent(
      'Active Onboardings: 2'
    );
  });
});
