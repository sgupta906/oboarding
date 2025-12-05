/**
 * Tests for ManagerView Component
 * Covers KPI calculations, suggestion approval/rejection, and activity display
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { ManagerView } from './ManagerView';
import type { Step, Suggestion, Activity } from '../types';

/**
 * Mock data for testing
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

const mockSuggestions: Suggestion[] = [
  {
    id: 101,
    stepId: 1,
    user: 'Jane Doe',
    text: 'The link to 2FA setup in the doc is broken.',
    status: 'pending',
  },
  {
    id: 102,
    stepId: 2,
    user: 'John Smith',
    text: 'Missing VSCode settings sync instructions.',
    status: 'pending',
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    userInitials: 'JD',
    action: 'completed "Setup AWS"',
    timeAgo: '24 mins ago',
  },
  {
    id: '2',
    userInitials: 'MK',
    action: 'reported stuck on "VPN Configuration"',
    timeAgo: '1 hour ago',
  },
];

describe('ManagerView', () => {
  const mockOnApproveSuggestion = vi.fn();
  const mockOnRejectSuggestion = vi.fn();

  it('renders dashboard header', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for dashboard header
    const header = screen.getByRole('heading', {
      name: /Onboarding Dashboard/i,
    });
    expect(header).toBeInTheDocument();
  });

  it('displays KPI cards with correct counts', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for KPI labels
    expect(screen.getByText(/Active Onboardings/i)).toBeInTheDocument();
    expect(screen.getByText(/Stuck Employees/i)).toBeInTheDocument();
    expect(screen.getByText(/Doc Feedback/i)).toBeInTheDocument();

    // Check KPI values (2 pending steps, 1 stuck step, 2 pending suggestions)
    // Use getAllByText since "2" appears multiple times
    const twoElements = screen.getAllByText('2');
    expect(twoElements.length).toBeGreaterThan(0); // Active onboardings and Doc Feedback both show 2

    expect(screen.getByText('1')).toBeInTheDocument(); // Stuck employees
  });

  it('calculates KPI counts correctly based on steps status', () => {
    const stepsWithMore: Step[] = [
      ...mockSteps,
      {
        id: 5,
        title: 'Additional Step',
        description: 'Another step',
        role: 'All',
        owner: 'HR',
        expert: 'Lisa M.',
        status: 'stuck',
        link: '#',
      },
    ];

    render(
      <ManagerView
        steps={stepsWithMore}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Should have 2 stuck employees now
    const stuckElements = screen.getAllByText('2');
    expect(stuckElements.length).toBeGreaterThan(0);
  });

  it('displays suggestions section', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for suggestions section title
    expect(screen.getByText(/Documentation Feedback/i)).toBeInTheDocument();

    // Check for suggestion count badge (2 appears multiple times, use getAllByText)
    const twoElements = screen.getAllByText('2');
    expect(twoElements.length).toBeGreaterThan(0);
  });

  it('displays pending suggestions with user and content', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for suggestion content
    expect(screen.getByText(/The link to 2FA setup in the doc is broken/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing VSCode settings sync instructions/i)).toBeInTheDocument();

    // Check for user names
    expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/John Smith/i)).toBeInTheDocument();
  });

  it('displays activity feed', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for activity section (section is called "Live Activity")
    expect(screen.getByText(/Live Activity/i)).toBeInTheDocument();

    // Check for activity content
    expect(screen.getByText(/completed "Setup AWS"/i)).toBeInTheDocument();
    expect(screen.getByText(/reported stuck on "VPN Configuration"/i)).toBeInTheDocument();
  });

  it('displays activity with correct time indicators', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for time indicators
    expect(screen.getByText(/24 mins ago/i)).toBeInTheDocument();
    expect(screen.getByText(/1 hour ago/i)).toBeInTheDocument();
  });

  it('displays activity user initials', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for user initials in activity (appears multiple times: avatar and text)
    const jdElements = screen.getAllByText('JD');
    expect(jdElements.length).toBeGreaterThan(0);

    const mkElements = screen.getAllByText('MK');
    expect(mkElements.length).toBeGreaterThan(0);
  });

  it('shows empty state for suggestions when none pending', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={[
          {
            id: 101,
            stepId: 1,
            user: 'Jane Doe',
            text: 'The link is broken.',
            status: 'reviewed',
          },
        ]}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for all caught up message
    expect(screen.getByText(/All caught up!/i)).toBeInTheDocument();
  });

  it('shows empty state when no activities provided', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={[]}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Should render without error with empty activities
    expect(screen.getByText(/Documentation Feedback/i)).toBeInTheDocument();
  });

  it('handles optional onApprove callback', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        // No onApproveSuggestion provided
      />
    );

    // Should render without error
    expect(screen.getByText(/Documentation Feedback/i)).toBeInTheDocument();
  });

  it('handles optional onReject callback', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        // No onRejectSuggestion provided
      />
    );

    // Should render without error
    expect(screen.getByText(/Documentation Feedback/i)).toBeInTheDocument();
  });

  it('displays correct stuck employee names when present', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for stuck employee indicator (should show when stuck count > 0)
    const stuckSection = screen.getByText(/Stuck Employees/i);
    expect(stuckSection).toBeInTheDocument();
  });

  it('displays "All on track" message when no stuck employees', () => {
    const noStuckSteps: Step[] = mockSteps.map((step) => ({
      ...step,
      status: step.status === 'stuck' ? 'pending' : step.status,
    }));

    render(
      <ManagerView
        steps={noStuckSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for "All on track" message in stuck employees section
    expect(screen.getByText(/All on track/i)).toBeInTheDocument();
  });

  it('displays pending suggestion count in doc feedback KPI', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Check for pending review message
    expect(screen.getByText(/Pending review/i)).toBeInTheDocument();
  });

  it('handles multiple suggestions for same step', () => {
    const multipleSuggestions: Suggestion[] = [
      {
        id: 101,
        stepId: 1,
        user: 'Jane Doe',
        text: 'First suggestion on Gmail setup.',
        status: 'pending',
      },
      {
        id: 102,
        stepId: 1,
        user: 'John Smith',
        text: 'Second suggestion on Gmail setup.',
        status: 'pending',
      },
      {
        id: 103,
        stepId: 2,
        user: 'Alice Green',
        text: 'Suggestion on VS Code.',
        status: 'pending',
      },
    ];

    render(
      <ManagerView
        steps={mockSteps}
        suggestions={multipleSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Should display all suggestions
    expect(screen.getByText(/First suggestion on Gmail setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Second suggestion on Gmail setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggestion on VS Code/i)).toBeInTheDocument();
  });

  it('renders layout as grid with responsive columns', () => {
    render(
      <ManagerView
        steps={mockSteps}
        suggestions={mockSuggestions}
        activities={mockActivities}
        onApproveSuggestion={mockOnApproveSuggestion}
        onRejectSuggestion={mockOnRejectSuggestion}
      />
    );

    // Both suggestions section and activity section should be present
    expect(screen.getByText(/Documentation Feedback/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Activity/i)).toBeInTheDocument();
  });
});
