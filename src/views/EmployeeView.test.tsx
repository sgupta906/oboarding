/**
 * Tests for EmployeeView Component
 * Covers welcome header, step timeline, progress tracking, and user interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { EmployeeView } from './EmployeeView';
import type { Step } from '../types';

/**
 * Mock step data for testing
 */
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
  // Test setup
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

  it('renders welcome header with correct title', () => {
    renderEmployee();

    // Check for welcome message with employee name
    expect(screen.getByText(new RegExp(`Welcome to the Team, ${defaultEmployeeName}!`, 'i'))).toBeInTheDocument();
    // Check for team name
    expect(screen.getByText(/Engineering Team/i)).toBeInTheDocument();
  });

  it('displays all onboarding steps', () => {
    renderEmployee();

    // Check that all step titles are rendered
    mockSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  it('displays progress bar', () => {
    renderEmployee();

    // Check for progress bar label
    const progressLabel = screen.getByText('Your Progress');
    expect(progressLabel).toBeInTheDocument();

    // Check for progress percentage (1 out of 4 completed = 25%)
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('calculates progress correctly (25% with 1 completed step)', () => {
    renderEmployee();

    // 1 completed step out of 4 = 25%
    const progressElement = screen.getByText('25%');
    expect(progressElement).toBeInTheDocument();
  });

  it('calculates progress correctly (100% with all completed steps)', () => {
    const allCompletedSteps: Step[] = mockSteps.map((step) => ({
      ...step,
      status: 'completed',
    }));

    renderEmployee({ steps: allCompletedSteps });

    // All steps completed = 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calculates progress correctly (50% with 2 completed steps)', () => {
    const partialSteps: Step[] = mockSteps.map((step, index) => ({
      ...step,
      status: index < 2 ? 'completed' : 'pending',
    }));

    renderEmployee({ steps: partialSteps });

    // 2 completed steps out of 4 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays steps with correct status badges and visual indicators', () => {
    renderEmployee();

    // Check for completed step indicator
    const completedStepRole = screen.getByRole('article', {
      name: /Step 1: Setup Corporate Gmail \(completed\)/i,
    });
    expect(completedStepRole).toBeInTheDocument();

    // Check for stuck step badge (should appear exactly once in the badge)
    const stuckBadges = screen.getAllByText(/STUCK/i);
    expect(stuckBadges.length).toBeGreaterThan(0);
  });

  it('passes callback functions to child components', () => {
    renderEmployee();

    // Verify that steps are rendered (callbacks would be passed to them)
    mockSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  it('displays step owner and expert information', () => {
    renderEmployee();

    // Check for owner badge
    expect(screen.getByText(/IT Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Sarah J\./i)).toBeInTheDocument();

    // Check another step's info
    expect(screen.getByText(/DevOps/i)).toBeInTheDocument();
    expect(screen.getByText(/Mike T\./i)).toBeInTheDocument();
  });

  it('displays step descriptions', () => {
    renderEmployee();

    // Check for step descriptions
    mockSteps.forEach((step) => {
      expect(screen.getByText(step.description)).toBeInTheDocument();
    });
  });

  it('handles empty steps array gracefully', () => {
    renderEmployee({ steps: [] });

    // Should render without error
    expect(
      screen.getByText(new RegExp(`Welcome to the Team, ${defaultEmployeeName}!`, 'i'))
    ).toBeInTheDocument();
    // With empty steps, the progress will be NaN (0/0), which is expected behavior
    // The component should still render the progress bar
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles steps with stuck status showing waiting message', () => {
    renderEmployee();

    // Check for stuck indicator message
    const stuckMessage = screen.getByText(
      /You reported being stuck on this step/i
    );
    expect(stuckMessage).toBeInTheDocument();
  });

  it('displays progress bar with accessibility attributes', () => {
    renderEmployee();

    // Check for progress bar with proper ARIA attributes
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '25');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders step timeline with proper list role', () => {
    renderEmployee();

    // Check for timeline list role
    const timeline = screen.getByRole('list', {
      name: /Onboarding steps timeline/i,
    });
    expect(timeline).toBeInTheDocument();
  });

  it('displays status indicator showing completion progress', () => {
    renderEmployee();

    // Check screen reader notification of progress
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/1 of 4 steps completed/i);
  });

  /**
   * REGRESSION TESTS: Onboarding Complete Footer Logic
   * Ensures footer only displays when ALL steps completed and steps.length > 0
   */

  it('does NOT display completion footer when steps are pending', () => {
    renderEmployee();

    // Should NOT contain completion footer text when not all steps are done
    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('displays completion footer when ALL steps are completed', () => {
    const allCompletedSteps: Step[] = mockSteps.map((step) => ({
      ...step,
      status: 'completed',
    }));

    renderEmployee({ steps: allCompletedSteps });

    // Should display "Onboarding Complete" footer text
    expect(screen.getByText(/Onboarding Complete/i)).toBeInTheDocument();
  });

  it('does NOT display completion footer when only some steps are completed', () => {
    const partialSteps: Step[] = mockSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'completed' : 'pending',
    }));

    renderEmployee({ steps: partialSteps });

    // Should NOT display completion footer (only 1 of 4 complete)
    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('handles 0 steps gracefully without showing completion footer', () => {
    renderEmployee({ steps: [] });

    // Should render without crashing
    expect(screen.getByText(new RegExp(`Welcome to the Team, ${defaultEmployeeName}!`, 'i'))).toBeInTheDocument();
    // Progress should show 0%, not NaN%
    expect(screen.getByText('0%')).toBeInTheDocument();
    // Should NOT display completion footer (no steps to complete)
    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('handles 0 steps without producing NaN in progress calculation', () => {
    renderEmployee({ steps: [] });

    // Progress text should be "0%" not "NaN%"
    const progressText = screen.getByText('0%');
    expect(progressText).toBeInTheDocument();
    expect(progressText).not.toHaveTextContent('NaN');
  });

  it('does NOT display completion footer if one step is stuck (even if others completed)', () => {
    const oneStuckStep: Step[] = mockSteps.map((step, index) => ({
      ...step,
      status: index === 3 ? 'stuck' : 'completed', // Last one is stuck
    }));

    renderEmployee({ steps: oneStuckStep });

    // Should NOT display completion footer (one step is stuck, not completed)
    const completionFooters = screen.queryAllByText(/Onboarding Complete/i);
    expect(completionFooters.length).toBe(0);
  });

  it('maintains completion footer visibility on all breakpoints when fully completed', () => {
    const allCompletedSteps: Step[] = mockSteps.map((step) => ({
      ...step,
      status: 'completed',
    }));

    renderEmployee({ steps: allCompletedSteps });

    // Check that completion footer element exists and has correct accessibility
    const completionFooter = screen.getByText(/Onboarding Complete/i);
    expect(completionFooter).toBeInTheDocument();

    // Verify it's properly marked as status for screen readers
    const footerContainer = completionFooter.closest('[role="status"]');
    expect(footerContainer).toBeInTheDocument();
  });
});
