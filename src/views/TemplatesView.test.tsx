/**
 * Unit tests for TemplatesView component
 * Tests list display, CRUD operations, and user interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplatesView } from './TemplatesView';
import type { Template } from '../types';

// Mock dataClient
vi.mock('../services/dataClient', () => ({
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  subscribeToTemplates: vi.fn(),
}));

// Mock useTemplates and useRoles hooks
vi.mock('../hooks', () => ({
  useTemplates: vi.fn(),
  useRoles: vi.fn(),
}));

import { useTemplates, useRoles } from '../hooks';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockTemplate: Template = {
  id: 'template-1',
  name: 'Engineering Onboarding',
  description: 'Onboarding for engineers',
  role: 'Engineering',
  steps: [
    {
      id: 1,
      title: 'Setup Dev Environment',
      description: 'Install tools',
      role: 'Engineering',
      owner: 'DevOps',
      expert: 'John Doe',
      status: 'pending',
      link: '',
    },
  ],
  createdAt: Date.now(),
  isActive: true,
};

const mockTemplates: Template[] = [mockTemplate];

// ============================================================================
// Test Cases
// ============================================================================

const mockRoles = [
  {
    id: 'role-1',
    name: 'Engineering',
    description: 'Engineering role',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin-user',
  },
];

describe('TemplatesView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRoles).mockReturnValue({
      roles: mockRoles,
      isLoading: false,
      error: null,
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      refetch: vi.fn(),
    });
  });

  it('should display loading spinner while templates are loading', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('should display empty state when no templates exist', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    expect(screen.getByText('No templates yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first onboarding template to get started')
    ).toBeInTheDocument();
  });

  it('should display list of templates in grid layout', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    expect(screen.getByText('Engineering Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Onboarding for engineers')).toBeInTheDocument();
  });

  it('should display error state with retry button', () => {
    const mockError = new Error('Failed to load templates');
    const mockRefetch = vi.fn();

    vi.mocked(useTemplates).mockReturnValue({
      data: [],
      isLoading: false,
      error: mockError,
      refetch: mockRefetch,
    });

    render(<TemplatesView />);

    const errorHeadings = screen.getAllByText('Failed to load templates');
    expect(errorHeadings.length).toBeGreaterThan(0);
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should show create template button in header', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    const buttons = screen.getAllByRole('button');
    const createButton = buttons.find((btn) =>
      btn.textContent?.toLowerCase().includes('create')
    );
    expect(createButton).toBeDefined();
  });

  it('should display status badge as Published for active templates', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('should display status badge as Draft for inactive templates', () => {
    const draftTemplate: Template = {
      ...mockTemplate,
      isActive: false,
    };

    vi.mocked(useTemplates).mockReturnValue({
      data: [draftTemplate],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should display templates in a responsive grid layout', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    // Check that template cards are displayed
    expect(screen.getByText('Engineering Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Onboarding for engineers')).toBeInTheDocument();
  });

  it('should display template role tag', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('should display step count for templates', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    expect(screen.getByText('1')).toBeInTheDocument(); // 1 step
  });

  it('should have Edit button for each template', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should have Duplicate button for each template', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    const duplicateButtons = screen.getAllByRole('button', { name: /duplicate/i });
    expect(duplicateButtons.length).toBeGreaterThan(0);
  });

  it('should display action buttons for each template', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TemplatesView />);

    const editButtons = screen.getAllByLabelText(/Edit template/);
    expect(editButtons.length).toBeGreaterThan(0);
  });
});
