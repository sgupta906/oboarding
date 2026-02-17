/**
 * ManagerView Component Tests
 * Integration tests for the self-contained ManagerView pattern.
 * Validates that ManagerView calls hooks directly, computes derived data,
 * and handles suggestion approve/reject with optimistic updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { ManagerView } from './ManagerView';
import type { Suggestion, Activity, OnboardingInstance, Step } from '../types';

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
    status: 'completed',
    link: '',
  },
  {
    id: 2,
    title: 'Read handbook',
    description: 'Read the handbook',
    role: 'All',
    owner: 'HR',
    expert: 'Jane',
    status: 'stuck',
    link: '',
  },
];

const mockSteps2: Step[] = [
  {
    id: 3,
    title: 'Team intro',
    description: 'Meet the team',
    role: 'Engineering',
    owner: 'Manager',
    expert: 'Bob',
    status: 'pending',
    link: '',
  },
];

const mockSuggestions: Suggestion[] = [
  {
    id: 1,
    stepId: 1,
    user: 'Alice',
    text: 'Add more detail',
    status: 'pending',
    instanceId: 'inst-1',
  },
  {
    id: 2,
    stepId: 2,
    user: 'Bob',
    text: 'Clarify instructions',
    status: 'pending',
    instanceId: 'inst-1',
  },
];

const mockActivities: Activity[] = [
  {
    id: 'act-1',
    userInitials: 'AS',
    action: 'completed step 1',
    timeAgo: '2 min ago',
  },
  {
    id: 'act-2',
    userInitials: 'BJ',
    action: 'reported stuck on step 2',
    timeAgo: '5 min ago',
  },
];

const mockInstances: OnboardingInstance[] = [
  {
    id: 'inst-1',
    employeeName: 'Alice Smith',
    employeeEmail: 'alice@example.com',
    role: 'Engineering',
    department: 'Tech',
    templateId: 'tmpl-1',
    steps: mockSteps,
    createdAt: 1701532800000,
    startDate: 1701532800000,
    progress: 50,
    status: 'active',
  },
  {
    id: 'inst-2',
    employeeName: 'Bob Johnson',
    employeeEmail: 'bob@example.com',
    role: 'Design',
    department: 'Product',
    templateId: 'tmpl-2',
    steps: mockSteps2,
    createdAt: 1701619200000,
    startDate: 1701619200000,
    progress: 0,
    status: 'active',
  },
];

// ---------------------------------------------------------------------------
// Mock Return Values (mutable for per-test overrides)
// ---------------------------------------------------------------------------

let mockSuggestionsReturn: {
  data: Suggestion[];
  isLoading: boolean;
  error: Error | null;
  optimisticUpdateStatus: ReturnType<typeof vi.fn>;
  optimisticRemove: ReturnType<typeof vi.fn>;
  rollback: ReturnType<typeof vi.fn>;
};

let mockActivitiesReturn: {
  data: Activity[];
  isLoading: boolean;
  error: Error | null;
};

let mockInstancesReturn: {
  data: OnboardingInstance[];
  isLoading: boolean;
  error: Error | null;
};

const mockShowToast = vi.fn();
const mockUpdateSuggestionStatus = vi.fn();
const mockDeleteSuggestion = vi.fn();
const mockLogActivity = vi.fn();

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../hooks', () => ({
  useSuggestions: () => mockSuggestionsReturn,
  useActivities: () => mockActivitiesReturn,
  useOnboardingInstances: () => mockInstancesReturn,
  useCreateOnboarding: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    reset: vi.fn(),
  }),
  useRoles: () => ({
    roles: [],
    isLoading: false,
  }),
  useTemplates: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('../services/supabase', () => ({
  updateSuggestionStatus: (...args: unknown[]) => mockUpdateSuggestionStatus(...args),
  deleteSuggestion: (...args: unknown[]) => mockDeleteSuggestion(...args),
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

vi.mock('../config/authContext', () => ({
  useAuth: () => ({ user: { email: 'manager@example.com' }, role: 'manager' }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ManagerView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSuggestionsReturn = {
      data: mockSuggestions,
      isLoading: false,
      error: null,
      optimisticUpdateStatus: vi.fn().mockReturnValue([...mockSuggestions]),
      optimisticRemove: vi.fn().mockReturnValue([...mockSuggestions]),
      rollback: vi.fn(),
    };

    mockActivitiesReturn = {
      data: mockActivities,
      isLoading: false,
      error: null,
    };

    mockInstancesReturn = {
      data: mockInstances,
      isLoading: false,
      error: null,
    };

    mockUpdateSuggestionStatus.mockResolvedValue(undefined);
    mockDeleteSuggestion.mockResolvedValue(undefined);
    mockLogActivity.mockResolvedValue(undefined);
  });

  // ---- Rendering Tests ----

  describe('Rendering', () => {
    it('renders dashboard tab by default with KPI, suggestions, and activity sections', () => {
      render(<ManagerView />);

      // Dashboard tab should be active
      const dashboardTab = screen.getByRole('button', { name: /show dashboard view/i });
      expect(dashboardTab).toHaveAttribute('aria-current', 'page');

      // KPI section renders (uses steps + suggestions data)
      // Verify the sections are present via their headings
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
      expect(screen.getByText('Documentation Feedback')).toBeInTheDocument();
    });

    it('shows loading indicator when hooks are loading', () => {
      mockSuggestionsReturn.isLoading = true;
      render(<ManagerView />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('shows loading when activities are loading', () => {
      mockActivitiesReturn.isLoading = true;
      render(<ManagerView />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('shows loading when instances are loading', () => {
      mockInstancesReturn.isLoading = true;
      render(<ManagerView />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });
  });

  // ---- Tab Navigation ----

  describe('Tab Navigation', () => {
    it('switches to Roles tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ManagerView />);

      await user.click(screen.getByRole('button', { name: /show roles management view/i }));

      // Roles tab should be active
      const rolesTab = screen.getByRole('button', { name: /show roles management view/i });
      expect(rolesTab).toHaveAttribute('aria-current', 'page');
    });

    it('switches to New Hires tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ManagerView />);

      await user.click(screen.getByRole('button', { name: /show new hires view/i }));

      const newHiresTab = screen.getByRole('button', { name: /show new hires view/i });
      expect(newHiresTab).toHaveAttribute('aria-current', 'page');
    });

    it('switches to Users tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ManagerView />);

      await user.click(screen.getByRole('button', { name: /show users management view/i }));

      const usersTab = screen.getByRole('button', { name: /show users management view/i });
      expect(usersTab).toHaveAttribute('aria-current', 'page');
    });
  });

  // ---- Derived Data Computation ----

  describe('Derived Data', () => {
    it('computes managerSteps by flatMapping instance steps', () => {
      render(<ManagerView />);

      // managerSteps should combine steps from both instances (mockSteps + mockSteps2)
      // Total steps = 2 + 1 = 3. KPISection receives these steps.
      // We can verify indirectly by checking the stuck count display
      // (1 stuck step out of 3 total steps from the instances)
      // The "Stuck Employees" KPI should show the stuck employee name
      expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    });

    it('computes stuckEmployeeNames from instances with stuck steps', () => {
      render(<ManagerView />);

      // Instance 1 (Alice) has a 'stuck' step, Instance 2 (Bob) does not
      // stuckEmployeeNames should contain 'Alice Smith'
      // KPISection displays stuck employee count - Alice has stuck steps
      // We verify by seeing Alice's name in the stuck tooltip
      expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    });
  });

  // ---- Suggestion Approve/Reject Handlers ----

  describe('handleApproveSuggestion', () => {
    it('calls optimisticUpdateStatus and updateSuggestionStatus on approve', async () => {
      const user = userEvent.setup();
      render(<ManagerView />);

      // Find approve buttons in the suggestions section
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      expect(approveButtons.length).toBeGreaterThan(0);

      await user.click(approveButtons[0]);

      // Verify optimistic update was called
      expect(mockSuggestionsReturn.optimisticUpdateStatus).toHaveBeenCalledWith(1, 'reviewed');

      // Verify server call
      await waitFor(() => {
        expect(mockUpdateSuggestionStatus).toHaveBeenCalledWith('1', 'reviewed');
      });

      // Verify activity was logged with employee name and step title
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.stringContaining('approved suggestion from Alice on'),
          })
        );
      });
    });

    it('rolls back on server error and shows toast', async () => {
      const snapshot = [...mockSuggestions];
      mockSuggestionsReturn.optimisticUpdateStatus.mockReturnValue(snapshot);
      mockUpdateSuggestionStatus.mockRejectedValue(new Error('Server error'));

      const user = userEvent.setup();
      render(<ManagerView />);

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockSuggestionsReturn.rollback).toHaveBeenCalledWith(snapshot);
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to approve suggestion. Please try again.',
          'error'
        );
      });
    });
  });

  describe('handleRejectSuggestion', () => {
    it('calls optimisticRemove and deleteSuggestion on reject', async () => {
      const user = userEvent.setup();
      render(<ManagerView />);

      // Find reject buttons in the suggestions section
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      expect(rejectButtons.length).toBeGreaterThan(0);

      await user.click(rejectButtons[0]);

      // Verify optimistic remove was called
      expect(mockSuggestionsReturn.optimisticRemove).toHaveBeenCalledWith(1);

      // Verify server call
      await waitFor(() => {
        expect(mockDeleteSuggestion).toHaveBeenCalledWith('1');
      });

      // Verify activity was logged with employee name and step title
      // First reject button corresponds to the first pending suggestion (Alice, stepId 1)
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.stringContaining('rejected suggestion from Alice on'),
          })
        );
      });
    });

    it('rolls back on server error and shows toast', async () => {
      const snapshot = [...mockSuggestions];
      mockSuggestionsReturn.optimisticRemove.mockReturnValue(snapshot);
      mockDeleteSuggestion.mockRejectedValue(new Error('Server error'));

      const user = userEvent.setup();
      render(<ManagerView />);

      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(mockSuggestionsReturn.rollback).toHaveBeenCalledWith(snapshot);
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to reject suggestion. Please try again.',
          'error'
        );
      });
    });
  });

  // ---- Step Title Resolution in Activity Messages (Bug #43) ----

  describe('Step title resolution in activity messages', () => {
    it('approve activity message includes employee name and step title from instance', async () => {
      const user = userEvent.setup();
      render(<ManagerView />);

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'approved suggestion from Alice on "Setup laptop"',
          })
        );
      });
    });

    it('reject activity message includes employee name and step title from instance', async () => {
      const user = userEvent.setup();
      render(<ManagerView />);

      // Click the first reject button (suggestion from Alice on step 1 "Setup laptop")
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'rejected suggestion from Alice on "Setup laptop"',
          })
        );
      });
    });

    it('approve falls back to flat step lookup when instanceId is missing', async () => {
      // Override suggestions with one that has no instanceId
      mockSuggestionsReturn.data = [
        {
          id: 10,
          stepId: 1,
          user: 'Charlie',
          text: 'Missing instanceId suggestion',
          status: 'pending',
        },
      ];

      const user = userEvent.setup();
      render(<ManagerView />);

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.stringContaining('approved suggestion from Charlie'),
          })
        );
      });
    });

    it('approve falls back to Step N when step not found', async () => {
      // Override suggestions with one that has a non-existent stepId
      mockSuggestionsReturn.data = [
        {
          id: 20,
          stepId: 999,
          user: 'Dave',
          text: 'Unknown step suggestion',
          status: 'pending',
          instanceId: 'inst-1',
        },
      ];

      const user = userEvent.setup();
      render(<ManagerView />);

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.stringContaining('Step 999'),
          })
        );
      });
    });
  });

  // ---- SuggestionsSection Step Title Resolution (Bug #41) ----

  describe('SuggestionsSection step title resolution', () => {
    it('renders correct step title when instanceId matches an instance', () => {
      // Suggestion with stepId=1 and instanceId='inst-1' should show "Setup laptop"
      // (from inst-1's steps, not inst-2's steps)
      render(<ManagerView />);

      // The suggestion card shows the step title as a badge
      // Suggestion 1 has stepId=1, instanceId='inst-1', inst-1 step 1 = "Setup laptop"
      expect(screen.getByText('Setup laptop')).toBeInTheDocument();
    });

    it('falls back to flat steps lookup when instanceId is not provided', () => {
      // Override with a suggestion without instanceId
      mockSuggestionsReturn.data = [
        {
          id: 10,
          stepId: 1,
          user: 'Charlie',
          text: 'No instance suggestion',
          status: 'pending',
          // no instanceId
        },
      ];

      render(<ManagerView />);

      // Should still find step 1 title from flat managerSteps
      expect(screen.getByText('Setup laptop')).toBeInTheDocument();
    });

    it('falls back to flat steps when instanceId points to unknown instance', () => {
      // Override with a suggestion with unknown instanceId
      mockSuggestionsReturn.data = [
        {
          id: 10,
          stepId: 1,
          user: 'Charlie',
          text: 'Unknown instance suggestion',
          status: 'pending',
          instanceId: 'nonexistent',
        },
      ];

      render(<ManagerView />);

      // Should fall back to flat steps and find step 1 title
      expect(screen.getByText('Setup laptop')).toBeInTheDocument();
    });
  });
});
