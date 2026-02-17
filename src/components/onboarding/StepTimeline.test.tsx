/**
 * Unit tests for StepTimeline component
 * Tests rendering, dark mode class presence, and light mode regression
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Step, StepStatus } from '../../types';

// Mock StepCard to avoid deep dependency tree and capture hasPendingSuggestion prop
vi.mock('./StepCard', () => ({
  StepCard: ({ step, hasPendingSuggestion }: { step: Step; hasPendingSuggestion?: boolean }) => (
    <div
      data-testid={`step-card-${step.id}`}
      data-has-pending-suggestion={hasPendingSuggestion ? 'true' : 'false'}
    >
      {step.title}
    </div>
  ),
}));

const createStep = (id: number, status: StepStatus, title: string): Step => ({
  id,
  title,
  description: `Description for ${title}`,
  role: 'All',
  owner: 'IT',
  expert: 'Expert',
  status,
  link: '',
});

const defaultHandlers = {
  onStatusChange: vi.fn(),
  onSuggestEdit: vi.fn(),
  onReportStuck: vi.fn(),
};

describe('StepTimeline', () => {
  // Lazy import to ensure mock is registered before module loads
  const renderTimeline = async (steps: Step[]) => {
    const { StepTimeline } = await import('./StepTimeline');
    return render(
      <StepTimeline steps={steps} {...defaultHandlers} />
    );
  };

  it('renders step cards', async () => {
    const steps = [
      createStep(1, 'completed', 'Setup laptop'),
      createStep(2, 'pending', 'Meet team'),
    ];

    await renderTimeline(steps);

    expect(screen.getByText('Setup laptop')).toBeInTheDocument();
    expect(screen.getByText('Meet team')).toBeInTheDocument();
  });

  it('completion footer has dark mode classes', async () => {
    const steps = [
      createStep(1, 'completed', 'Step A'),
      createStep(2, 'completed', 'Step B'),
    ];

    await renderTimeline(steps);

    // The completion footer contains "Onboarding Complete"
    const completionText = screen.getByText('Onboarding Complete');
    const footerDiv = completionText.closest('div.flex.items-center');
    expect(footerDiv).not.toBeNull();
    expect(footerDiv!.className).toContain('dark:bg-emerald-900/20');
    expect(footerDiv!.className).toContain('dark:border-emerald-700');

    // The text itself should have dark mode class
    expect(completionText.className).toContain('dark:text-emerald-300');
  });

  it('light mode classes still present (regression)', async () => {
    const steps = [
      createStep(1, 'completed', 'Step A'),
      createStep(2, 'completed', 'Step B'),
    ];

    await renderTimeline(steps);

    const completionText = screen.getByText('Onboarding Complete');
    const footerDiv = completionText.closest('div.flex.items-center');
    expect(footerDiv).not.toBeNull();
    expect(footerDiv!.className).toContain('bg-emerald-50');
    expect(footerDiv!.className).toContain('border-emerald-200');
    expect(completionText.className).toContain('text-emerald-700');
  });

  it('forwards hasPendingSuggestion=true to StepCard when step.id is in stepsWithPendingSuggestions', async () => {
    const steps = [
      createStep(1, 'pending', 'Step A'),
      createStep(2, 'pending', 'Step B'),
    ];
    const suggestionsSet = new Set([1]);

    const { StepTimeline } = await import('./StepTimeline');
    render(
      <StepTimeline
        steps={steps}
        {...defaultHandlers}
        stepsWithPendingSuggestions={suggestionsSet}
      />
    );

    const stepCard1 = screen.getByTestId('step-card-1');
    const stepCard2 = screen.getByTestId('step-card-2');
    expect(stepCard1.getAttribute('data-has-pending-suggestion')).toBe('true');
    expect(stepCard2.getAttribute('data-has-pending-suggestion')).toBe('false');
  });

  it('forwards hasPendingSuggestion=false when step.id is NOT in stepsWithPendingSuggestions', async () => {
    const steps = [
      createStep(1, 'pending', 'Step A'),
      createStep(2, 'pending', 'Step B'),
    ];
    const suggestionsSet = new Set<number>();

    const { StepTimeline } = await import('./StepTimeline');
    render(
      <StepTimeline
        steps={steps}
        {...defaultHandlers}
        stepsWithPendingSuggestions={suggestionsSet}
      />
    );

    const stepCard1 = screen.getByTestId('step-card-1');
    const stepCard2 = screen.getByTestId('step-card-2');
    expect(stepCard1.getAttribute('data-has-pending-suggestion')).toBe('false');
    expect(stepCard2.getAttribute('data-has-pending-suggestion')).toBe('false');
  });
});
