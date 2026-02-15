/**
 * NewHiresPanel Component Tests
 * Tests for read-only onboarding instances table with status filter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { NewHiresPanel } from './NewHiresPanel';
import type { OnboardingInstance } from '../../types';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockInstances: OnboardingInstance[] = [
  {
    id: 'inst-1',
    employeeName: 'Alice Smith',
    employeeEmail: 'alice@example.com',
    role: 'Engineering',
    department: 'Tech',
    templateId: 'tmpl-1',
    steps: [],
    createdAt: 1701532800000,
    startDate: 1701532800000,
    progress: 45,
    status: 'active',
  },
  {
    id: 'inst-2',
    employeeName: 'Bob Johnson',
    employeeEmail: 'bob@example.com',
    role: 'Design',
    department: 'Product',
    templateId: 'tmpl-2',
    steps: [],
    createdAt: 1701619200000,
    startDate: 1701619200000,
    progress: 100,
    status: 'completed',
  },
  {
    id: 'inst-3',
    employeeName: 'Charlie Brown',
    employeeEmail: 'charlie@example.com',
    role: 'Sales',
    department: 'Revenue',
    templateId: 'tmpl-3',
    steps: [],
    createdAt: 1701705600000,
    startDate: 1701705600000,
    progress: 20,
    status: 'on_hold',
  },
];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockReturn: { data: OnboardingInstance[]; isLoading: boolean; error: Error | null } = {
  data: mockInstances,
  isLoading: false,
  error: null,
};

vi.mock('../../hooks', () => ({
  useOnboardingInstances: () => mockReturn,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NewHiresPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturn = { data: mockInstances, isLoading: false, error: null };
  });

  // ---- Rendering Tests ----

  describe('Rendering', () => {
    it('renders table with instance data', () => {
      render(<NewHiresPanel />);

      // Check all employee names
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();

      // Check emails
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();

      // Check departments
      expect(screen.getByText('Tech')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();

      // Check column headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
    });

    it('renders ProgressBar for each instance', () => {
      render(<NewHiresPanel />);

      // Each instance should have a progressbar
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);

      // Check values
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '45');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '100');
      expect(progressBars[2]).toHaveAttribute('aria-valuenow', '20');
    });

    it('renders correct status badge text', () => {
      render(<NewHiresPanel />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('On Hold')).toBeInTheDocument();
    });
  });

  // ---- Filter Tests ----

  describe('Filtering', () => {
    it('shows all instances by default', () => {
      render(<NewHiresPanel />);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('filters to only active instances when Active filter clicked', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /active/i }));

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
    });

    it('filters to only completed instances when Completed filter clicked', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
    });

    it('filters to only on_hold instances when On Hold filter clicked', async () => {
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /on hold/i }));

      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('filter buttons display correct counts', () => {
      render(<NewHiresPanel />);

      // All should show total count
      expect(screen.getByRole('button', { name: /all/i })).toHaveTextContent('3');
      // Each status should show its count
      expect(screen.getByRole('button', { name: /active/i })).toHaveTextContent('1');
      expect(screen.getByRole('button', { name: /completed/i })).toHaveTextContent('1');
      expect(screen.getByRole('button', { name: /on hold/i })).toHaveTextContent('1');
    });
  });

  // ---- State Tests ----

  describe('States', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockReturn = { data: [], isLoading: true, error: null };
      render(<NewHiresPanel />);

      expect(screen.getByText('Loading onboarding data...')).toBeInTheDocument();
    });

    it('shows error message when error is present', () => {
      mockReturn = { data: [], isLoading: false, error: new Error('Failed to fetch') };
      render(<NewHiresPanel />);

      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('shows empty state when no instances', () => {
      mockReturn = { data: [], isLoading: false, error: null };
      render(<NewHiresPanel />);

      expect(screen.getByText(/no new hires/i)).toBeInTheDocument();
    });

    it('shows filtered empty state when filter yields no results', async () => {
      // Only active instances, then filter to completed
      mockReturn = {
        data: [mockInstances[0]], // Only Alice (active)
        isLoading: false,
        error: null,
      };
      const user = userEvent.setup();
      render(<NewHiresPanel />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(screen.getByText(/no completed new hires/i)).toBeInTheDocument();
    });
  });
});
