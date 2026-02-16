/**
 * ActionBar Tests - Verify loading/disabled state behavior and readOnly mode
 * Tests: buttons disabled when loading, spinner visible, click handlers blocked,
 * readOnly hides buttons and shows "View Only" indicator
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from './ActionBar';
import type { Step } from '../../types';

const pendingStep: Step = {
  id: 1,
  title: 'Test Step',
  description: 'Test description',
  role: 'All',
  owner: 'IT',
  expert: 'Expert',
  status: 'pending',
  link: '',
};

const completedStep: Step = {
  ...pendingStep,
  status: 'completed',
};

const defaultHandlers = {
  onStatusChange: vi.fn(),
  onSuggestEdit: vi.fn(),
  onReportStuck: vi.fn(),
};

describe('ActionBar loading state', () => {
  it('disables buttons when isLoading is true (pending step)', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    expect(markDoneButton).toBeDisabled();

    const stuckButton = screen.getByLabelText(/Report stuck/);
    expect(stuckButton).toBeDisabled();

    const suggestEditButton = screen.getByLabelText(/Suggest edit/);
    expect(suggestEditButton).toBeDisabled();
  });

  it('shows loading spinner on primary button when isLoading is true', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    // The loading spinner should be visible via animate-spin class
    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    const spinner = markDoneButton.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('click handlers are not called when isLoading is true', async () => {
    const user = userEvent.setup();

    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    await user.click(markDoneButton);

    expect(defaultHandlers.onStatusChange).not.toHaveBeenCalled();
  });

  it('disables mark as incomplete when isLoading is true (completed step)', () => {
    render(
      <ActionBar
        step={completedStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    const incompleteButton = screen.getByLabelText(/Mark .* as incomplete/);
    expect(incompleteButton).toBeDisabled();
  });

  it('buttons are enabled when isLoading is false or undefined', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
      />
    );

    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    expect(markDoneButton).not.toBeDisabled();
  });
});

describe('ActionBar readOnly mode', () => {
  it('hides all action buttons when readOnly is true on a pending step', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        readOnly={true}
      />
    );

    // No action buttons should be rendered
    expect(screen.queryByLabelText(/Mark .* as done/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Report stuck/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Suggest edit/)).not.toBeInTheDocument();
  });

  it('shows "View Only" indicator when readOnly is true', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        readOnly={true}
      />
    );

    expect(screen.getByText('View Only')).toBeInTheDocument();
  });

  it('renders action buttons as normal when readOnly is false or undefined (regression guard)', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
      />
    );

    expect(screen.getByLabelText(/Mark .* as done/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Report stuck/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Suggest edit/)).toBeInTheDocument();
    expect(screen.queryByText('View Only')).not.toBeInTheDocument();
  });
});

describe('ActionBar dark mode', () => {
  it('border separator has dark:border-slate-700', () => {
    const { container } = render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
      />
    );

    // The root div has border-t border-slate-100
    const borderDiv = container.querySelector('.border-t');
    expect(borderDiv).not.toBeNull();
    expect(borderDiv!.className).toContain('dark:border-slate-700');
  });

  it('completed badge has dark mode classes', () => {
    const { container } = render(
      <ActionBar
        step={completedStep}
        {...defaultHandlers}
      />
    );

    const completedBadge = container.querySelector('.bg-emerald-50');
    expect(completedBadge).not.toBeNull();
    expect(completedBadge!.className).toContain('dark:bg-emerald-900/20');
    expect(completedBadge!.className).toContain('dark:text-emerald-400');
  });

  it('light mode classes still present (regression)', () => {
    const { container } = render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
      />
    );

    // Border
    const borderDiv = container.querySelector('.border-t');
    expect(borderDiv!.className).toContain('border-slate-100');

    // I'm Stuck button
    const stuckButton = screen.getByLabelText(/Report stuck/);
    expect(stuckButton.className).toContain('text-rose-600');

    // Suggest Edit button
    const suggestButton = screen.getByLabelText(/Suggest edit/);
    expect(suggestButton.className).toContain('text-slate-500');
  });
});
