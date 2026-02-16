/**
 * Tests for EmployeeView Component
 * Covers progress tracking and completion footer regression tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { EmployeeView } from './EmployeeView';
import type { Step } from '../types';

const mockSteps: Step[] = [
  {
    id: 1,
    title: 'Setup Corporate Gmail',
    description: 'Your temporary password is in your personal email.',
    role: 'All',
    owner: 'IT Support',
    expert: 'Sarah J.',
    status: 'completed',
    link: '#',
  },
  {
    id: 2,
    title: 'Install VS Code & Extensions',
    description: "Download VS Code and install required extensions.",
    role: 'Engineering',
    owner: 'DevOps',
    expert: 'Mike T.',
    status: 'pending',
    link: '#',
  },
  {
    id: 3,
    title: 'Configure VPN Access',
    description: 'Download the Cisco AnyConnect client.',
    role: 'All',
    owner: 'NetSec',
    expert: 'Alex R.',
    status: 'pending',
    link: '#',
  },
  {
    id: 4,
    title: 'Join Slack Channels',
    description: 'Join #general, #engineering, and #random.',
    role: 'All',
    owner: 'HR',
    expert: 'Lisa M.',
    status: 'stuck',
    link: '#',
  },
];

describe('EmployeeView', () => {
  const mockOnStatusChange = vi.fn();
  const mockOnSuggestEdit = vi.fn();
  const mockOnReportStuck = vi.fn();

  const defaultEmployeeName = 'Alex';
  const defaultTeam = 'Engineering Team';

  const renderEmployee = (overrideProps: Partial<React.ComponentProps<typeof EmployeeView>> = {}) =>
    render(
      <EmployeeView
        steps={mockSteps}
        employeeName={defaultEmployeeName}
        team={defaultTeam}
        onStatusChange={mockOnStatusChange}
        onSuggestEdit={mockOnSuggestEdit}
        onReportStuck={mockOnReportStuck}
        {...overrideProps}
      />
    );

  it('displays progress bar', () => {
    renderEmployee();

    const progressLabel = screen.getByText('Your Progress');
    expect(progressLabel).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('calculates progress correctly (25% with 1 completed step)', () => {
    renderEmployee();

    const progressElement = screen.getByText('25%');
    expect(progressElement).toBeInTheDocument();
  });

  it('calculates progress correctly (100% with all completed steps)', () => {
    const allCompletedSteps: Step[] = mockSteps.map((step) => ({
      ...step,
      status: 'completed',
    }));

    renderEmployee({ steps: allCompletedSteps });

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calculates progress correctly (50% with 2 completed steps)', () => {
    const partialSteps: Step[] = mockSteps.map((step, index) => ({
      ...step,
      status: index < 2 ? 'completed' : 'pending',
    }));

    renderEmployee({ steps: partialSteps });

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays steps with correct status badges and visual indicators', () => {
    renderEmployee();

    const completedStepRole = screen.getByRole('article', {
      name: /Step 1: Setup Corporate Gmail \(completed\)/i,
    });
    expect(completedStepRole).toBeInTheDocument();

    const stuckBadges = screen.getAllByText(/STUCK/i);
    expect(stuckBadges.length).toBeGreaterThan(0);
  });

  /**
   * REGRESSION TESTS: Onboarding Complete Footer Logic
   * Ensures footer only displays when ALL steps completed and steps.length > 0
   */

  it('does NOT display completion footer when steps are pending', () => {
    renderEmployee();

    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('displays completion footer when ALL steps are completed', () => {
    const allCompletedSteps: Step[] = mockSteps.map((step) => ({
      ...step,
      status: 'completed',
    }));

    renderEmployee({ steps: allCompletedSteps });

    expect(screen.getByText(/Onboarding Complete/i)).toBeInTheDocument();
  });

  it('does NOT display completion footer when only some steps are completed', () => {
    const partialSteps: Step[] = mockSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'completed' : 'pending',
    }));

    renderEmployee({ steps: partialSteps });

    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('handles 0 steps gracefully without showing completion footer', () => {
    renderEmployee({ steps: [] });

    expect(screen.getByText(new RegExp(`Welcome to the Team, ${defaultEmployeeName}!`, 'i'))).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('handles 0 steps without producing NaN in progress calculation', () => {
    renderEmployee({ steps: [] });

    const progressText = screen.getByText('0%');
    expect(progressText).toBeInTheDocument();
    expect(progressText).not.toHaveTextContent('NaN');
  });

  it('does NOT display completion footer if one step is stuck (even if others completed)', () => {
    const oneStuckStep: Step[] = mockSteps.map((step, index) => ({
      ...step,
      status: index === 3 ? 'stuck' : 'completed',
    }));

    renderEmployee({ steps: oneStuckStep });

    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('hides action buttons when readOnly is true (manager viewing employee)', () => {
    renderEmployee({ readOnly: true });

    // No "Mark as Done" buttons should appear when readOnly
    expect(screen.queryByLabelText(/Mark .* as done/)).not.toBeInTheDocument();
    // No "I'm Stuck" buttons should appear when readOnly
    expect(screen.queryByLabelText(/Report stuck/)).not.toBeInTheDocument();
    // "View Only" indicator should be visible instead
    expect(screen.getAllByText('View Only').length).toBeGreaterThan(0);
  });
});
